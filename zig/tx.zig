const std = @import("std");
const Sha256 = std.crypto.hash.sha2.Sha256;
const FBStream = std.io.FixedBufferStream;

const ExtendedKey = @import("./extk.zig").ExtendedKey;
const hash160 = @import("./hash160.zig").hash160;
const doubleSha256 = @import(
    "./utils.zig",
).doubleSha256;

pub const Input = struct {
    const Self = @This();
    const hash_type_len: usize = 4;
    const script_len = 25;
    const sig_data_len: usize = Transaction.nversion_len + Sha256.digest_length * 3 + outpoint_len + 1 + script_len + amount_len + nsequence_len + Transaction.nlocktime_len + hash_type_len;

    pub const GetRandom = *const fn (out: *[random_len]u8) void;
    pub const txid_len: usize = 32;
    pub const index_len: usize = 4;
    pub const nsequence_len: usize = 4;
    pub const outpoint_len: usize = txid_len + index_len;
    pub const amount_len: usize = 8;
    pub const random_len: usize = 32;
    pub const length: usize = outpoint_len + 1 + nsequence_len;
    pub const max_witness_len: usize = 1 + 1 + 72 + 1 + 1 + 33;

    txid: *[txid_len]u8,
    index: *[index_len]u8,
    nsequence: *[nsequence_len]u8,
    amount: *[amount_len]u8,

    pub fn init(bytes: *[length]u8, amount: *[amount_len]u8) Self {
        return .{
            .txid = bytes[0..32],
            .index = bytes[32..36],
            .nsequence = @ptrCast(bytes[37..40]),
            .amount = amount,
        };
    }

    pub fn outpoint(self: Self) [outpoint_len]u8 {
        var ret: [outpoint_len]u8 = undefined;
        @memcpy(ret[0..32], self.txid);
        @memcpy(ret[32..], self.index);
        return ret;
    }

    inline fn sigData(
        self: Self,
        extk: ExtendedKey,
        nversion: *[4]u8,
        hash_prevouts: *[Sha256.digest_length]u8,
        hash_nsequences: *[Sha256.digest_length]u8,
        hash_outputs: *[Sha256.digest_length]u8,
        nlocktime: *[4]u8,
        out: *[sig_data_len]u8,
    ) void {
        var fb = std.io.fixedBufferStream(out);
        const w = fb.writer();
        _ = w.write(nversion) catch unreachable;
        _ = w.write(hash_prevouts) catch unreachable;
        _ = w.write(hash_nsequences) catch unreachable;
        _ = w.write(&self.outpoint()) catch unreachable;
        _ = w.write(&[_]u8{ 0x19, 0x76, 0xa9, 0x14 }) catch unreachable;
        _ = w.write(&extk.identifier()) catch unreachable;
        _ = w.write(&[_]u8{ 0x88, 0xac }) catch unreachable;
        _ = w.write(self.amount) catch unreachable;
        _ = w.write(self.nsequence) catch unreachable;
        _ = w.write(hash_outputs) catch unreachable;
        _ = w.write(nlocktime) catch unreachable;
        w.writeInt(u32, 1, .Little) catch unreachable;
    }

    pub fn witness(
        self: Self,
        writer: FBStream([]u8).Writer,
        extk: ExtendedKey,
        getRandom: GetRandom,
        nversion: *[4]u8,
        hash_prevouts: *[Sha256.digest_length]u8,
        hash_nsequences: *[Sha256.digest_length]u8,
        hash_outputs: *[Sha256.digest_length]u8,
        nlocktime: *[4]u8,
    ) !void {
        var sig_data: [sig_data_len]u8 = undefined;
        self.sigData(
            extk,
            nversion,
            hash_prevouts,
            hash_nsequences,
            hash_outputs,
            nlocktime,
            &sig_data,
        );
        var random: [random_len]u8 = undefined;
        getRandom(&random);
        var signature = try extk.sign(&sig_data, random);
        while (signature.s[0] >= 0x80) {
            getRandom(&random);
            signature = try extk.sign(&sig_data, random);
        }
        var sig_buf: [ExtendedKey.Signature.der_encoded_max_length]u8 = undefined;
        const serialized_signature = signature.toDer(&sig_buf);

        try writer.writeByte(2); // item count
        try writer.writeByte(@intCast(serialized_signature.len + 1));
        _ = try writer.write(serialized_signature);
        try writer.writeByte(1); // separator
        try writer.writeByte(ExtendedKey.public_key_length);
        _ = try writer.write(&extk.publicKeyCompressed());
    }

    pub fn verifyWitness(
        self: Self,
        extk: ExtendedKey,
        _witness: []u8,
        nversion: *[4]u8,
        hash_prevouts: *[Sha256.digest_length]u8,
        hash_nsequences: *[Sha256.digest_length]u8,
        hash_outputs: *[Sha256.digest_length]u8,
        nlocktime: *[4]u8,
    ) !void {
        var fb = std.io.fixedBufferStream(_witness);
        const r = fb.reader();
        if (try r.readByte() != 2) {
            return error.InvalidWitness;
        }
        const sig_len = (try r.readByte()) - 1;
        const sig_der = _witness[fb.pos .. fb.pos + sig_len];
        fb.pos += sig_len;
        if (try r.readByte() != 1) {
            return error.InvalidWitness;
        }
        if (try r.readByte() != ExtendedKey.public_key_length) {
            return error.InvalidWitness;
        }
        var public_key: [ExtendedKey.public_key_length]u8 = undefined;
        _ = try r.read(&public_key);
        if (std.mem.eql(u8, &extk.publicKeyCompressed(), &public_key) != true) {
            return error.InvalidWitness;
        }
        const signature = try ExtendedKey.Signature.fromDer(sig_der);
        var sig_data: [sig_data_len]u8 = undefined;
        self.sigData(
            extk,
            nversion,
            hash_prevouts,
            hash_nsequences,
            hash_outputs,
            nlocktime,
            &sig_data,
        );
        try signature.verify(&sig_data, extk.publicKey());
    }
};

const Output = struct {
    pub const script_length: usize = 22;
    pub const length: usize = 8 + 1 + script_length;
};

pub const Transaction = struct {
    const Self = @This();

    pub const nversion_len: usize = 4;
    pub const nlocktime_len: usize = 4;

    alloc: std.mem.Allocator,
    extk: ExtendedKey,
    tx: []u8,
    inputs: []Input,
    hash_prevouts: [Sha256.digest_length]u8,
    hash_nsequences: [Sha256.digest_length]u8,
    hash_outputs: [Sha256.digest_length]u8,
    tx_end: usize,

    pub fn getMaxSize(unsigned_tx_len: usize, input_count: usize) usize {
        return unsigned_tx_len + input_count * Input.max_witness_len;
    }

    pub fn init(
        alloc: std.mem.Allocator,
        extk: ExtendedKey,
        tx: []u8,
        amounts: []u8,
    ) !Self {
        const input_count: usize = tx[6];
        const inputs_start: usize = 7;
        const inputs_end: usize = inputs_start + input_count * Input.length;
        const output_count: usize = tx[inputs_end];
        const outputs_end: usize = inputs_end + 1 + output_count * Output.length;

        const inputs: []Input = try alloc.alloc(Input, input_count);
        var hash_prevouts: [Sha256.digest_length]u8 = undefined;
        var hash_nsequences: [Sha256.digest_length]u8 = undefined;
        {
            const prevouts = try alloc.alloc(
                u8,
                input_count * Input.outpoint_len,
            );
            defer alloc.free(prevouts);
            const nsequences = try alloc.alloc(
                u8,
                input_count * Input.nsequence_len,
            );
            defer alloc.free(nsequences);
            for (0..input_count) |i| {
                var start: usize = inputs_start + i * Input.length;
                const input = Input.init(
                    @ptrCast(tx[start .. start + Input.length]),
                    @ptrCast(
                        amounts[i * Input.amount_len .. (i + 1) * Input.amount_len],
                    ),
                );
                inputs[i] = input;
                start = i * Input.outpoint_len;
                @memcpy(
                    prevouts[start .. start + Input.outpoint_len],
                    &input.outpoint(),
                );
                start = i * Input.nsequence_len;
                @memcpy(
                    nsequences[start .. start + Input.nsequence_len],
                    input.nsequence,
                );
            }
            doubleSha256(prevouts, &hash_prevouts);
            doubleSha256(nsequences, &hash_nsequences);
        }
        var hash_outputs: [Sha256.digest_length]u8 = undefined;
        doubleSha256(tx[inputs_end + 1 .. outputs_end], &hash_outputs);
        return .{
            .alloc = alloc,
            .extk = extk,
            .tx = tx,
            .inputs = inputs,
            .hash_prevouts = hash_prevouts,
            .hash_nsequences = hash_nsequences,
            .hash_outputs = hash_outputs,
            .tx_end = outputs_end + 4,
        };
    }

    pub fn deinit(self: *Self) void {
        self.alloc.free(self.inputs);
    }

    pub fn sign(self: *Self, getRandom: Input.GetRandom) !void {
        var nlocktime: [4]u8 = undefined;
        @memcpy(&nlocktime, self.tx[self.tx_end - 4 .. self.tx_end]);
        var fb = std.io.fixedBufferStream(self.tx);
        const w = fb.writer();
        fb.pos = self.tx_end - 4;
        for (self.inputs) |input| {
            try input.witness(
                w,
                self.extk,
                getRandom,
                self.tx[0..4],
                &self.hash_prevouts,
                &self.hash_nsequences,
                &self.hash_outputs,
                &nlocktime,
            );
        }
        _ = try w.write(&nlocktime);
        self.tx_end = fb.pos;
    }

    pub fn verify(self: Self) !void {
        const inputs_end: usize = 7 + self.inputs.len * Input.length;
        const output_count: usize = self.tx[inputs_end];
        const outputs_end: usize = inputs_end + 1 + output_count * Output.length;
        var witness_start = outputs_end;
        for (self.inputs, 0..) |input, i| {
            _ = i;
            const sig_len: usize = self.tx[witness_start + 1];
            const witness_len: usize = sig_len + 37;
            try input.verifyWitness(
                self.extk,
                self.tx[witness_start .. witness_start + witness_len],
                self.tx[0..4],
                @constCast(&self.hash_prevouts),
                @constCast(&self.hash_nsequences),
                @constCast(&self.hash_outputs),
                @ptrCast(self.tx[self.tx_end - 4 .. self.tx_end]),
            );
            witness_start += witness_len;
        }
    }
};

test "sign transaction" {
    const alloc = std.testing.allocator;
    var seck: [32]u8 = undefined;
    _ = try std.fmt.hexToBytes(
        &seck,
        "619c335025c7f4012e556c2a58b2506e30b8511b53ade95ea316fd8c3286feb9",
    );
    const extk = try ExtendedKey.fromPrivateKey(seck);
    var unsignex_tx: [242]u8 = undefined;
    _ = try std.fmt.hexToBytes(
        &unsignex_tx,
        "010000000001016e43b51769bd566ee16b3de9c14b8dfb13c9e250f6d033e0ad3a4ee32058ed3e0100000000ffffffff02e80300000000000016001472b11f9b893032a316151b457d51614d5be4c2129c18000000000000160014c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2ffffffff",
    );
    const tx_buf = try alloc.alloc(
        u8,
        Transaction.getMaxSize(unsignex_tx.len, 1),
    );
    defer alloc.free(tx_buf);
    @memcpy(tx_buf[0..unsignex_tx.len], &unsignex_tx);
    const amounts = [_]u8{
        0x20,
        0x2c,
        0xb2,
        0x06,
        0,
        0,
        0,
        0,
        0x90,
        0x93,
        0x51,
        0x0d,
        0,
        0,
        0,
        0,
    };
    var tx = try Transaction.init(
        alloc,
        extk,
        tx_buf,
        @constCast(&amounts),
    );
    defer tx.deinit();
    const getRandomWrapper = struct {
        fn call(out: *[Input.random_len]u8) void {
            std.crypto.random.bytes(out);
        }
    };
    try tx.sign(getRandomWrapper.call);
    try tx.verify();
}
