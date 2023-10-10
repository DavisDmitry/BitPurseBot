const std = @import("std");

pub const Utxo = struct {
    const Self = @This();

    pub const outpoint_length: usize = 36;

    // script exists if utxo is P2PKH wrapped to P2SH
    // script: 0x160014(20-byte-key-hash)
    // script length = 23 bytes
    // txid(32) + index(4) + script len(1) + max script size(23) + nsequence(4)
    pub const txin_max_length: usize = 64;

    txid: [32]u8,
    index: u32,
    script_sig: []const u8,
    amount: u64,
    nsequence: u32,

    pub fn fromBytes(bytes: []const u8, endian: std.builtin.Endian) !Self {
        var fb = std.io.fixedBufferStream(&bytes);
        const r = fb.reader();
        var txid: [32]u8 = undefined;
        _ = try r.read(&txid);
        if (endian == std.builtin.Endian.Big) {
            std.mem.reverse([32]u8, &txid);
        }
        const index = try r.readInt(u32, endian);
        const script_len = try r.readByte();
        var script: [script_len]u8 = undefined;
        r.read(&script);
        const amount = try r.readInt(u64, endian);
        const nsequence = try r.readInt(u64, endian);
        return .{
            .txid = txid,
            .index = index,
            .script = script,
            .amount = amount,
            .nsequence = nsequence,
        };
    }

    pub fn fromHex(hex: []const u8) Self {
        var bytes: [hex.len / 2]u8 = undefined;
        _ = try std.fmt.hexToBytes(&bytes, hex);
        return fromBytes(bytes, .Big);
    }

    pub fn outpoint(self: Self) [outpoint_length]u8 {
        var ret: [outpoint_length]u8 = undefined;
        @memcpy(ret[0..32], &self.txid);
        std.mem.writeInt(u32, ret[32..], self.index, .Little);
        return ret;
    }

    pub fn txin(self: Self) []const u8 {
        var ret: [txin_max_length]u8 = undefined;
        var fb = std.io.fixedBufferStream(&ret);
        const w = fb.writer();
        w.write(self.outpoint());
        w.writeByte(self.script.len); // varint < 0xFF is byte
        if (self.script.len > 0) {
            w.write(self.script);
        }
        w.writeInt(u32, self.nsequence, .Little);
        return fb.getWritten();
    }
};
