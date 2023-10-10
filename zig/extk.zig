const std = @import("std");
const Hmac = std.crypto.auth.hmac.sha2.HmacSha512;
const Sha256 = std.crypto.hash.sha2.Sha256;
const Ecdsa = std.crypto.sign.ecdsa.EcdsaSecp256k1Sha256oSha256;

const hash160 = @import("./hash160.zig").hash160;
const doubleSha256 = @import(
    "./utils.zig",
).doubleSha256;

pub const ExtendedKey = struct {
    const Self = @This();
    const min_hardened: u32 = 0x80000000;
    const n: u256 = 115792089237316195423570985008687907852837564279074904382605163141518161494337; // Integers modulo the order of the curve

    // maybe move to comptime
    const Version = enum(u32) {
        mainnet_public = 0x04b24746,
        mainnet_private = 0x04b2430c,
        testnet_public = 0x045f1cf6,
        testnet_private = 0x045f18bc,

        pub fn get(public: bool, testnet: bool) Version {
            if (public) {
                if (testnet) return Version.testnet_public;
                return Version.mainnet_public;
            }
            if (testnet) return Version.testnet_private;
            return Version.mainnet_private;
        }
    };

    pub const Signature = Ecdsa.Signature;
    pub const noise_length = Ecdsa.noise_length;
    pub const public_key_length: usize = Ecdsa.PublicKey.compressed_sec1_encoded_length;
    pub const identifier_length: usize = 20;
    pub const serialized_length: usize = 82;
    pub const wif_length: usize = 38;

    _pair: Ecdsa.KeyPair,
    _chain: [32]u8,
    _depth: u8,
    _index: u32,
    _parent_id: [4]u8,
    _testnet: bool,

    pub fn fromPrivateKey(bytes: [32]u8) !Self {
        const secret_key = try Ecdsa.SecretKey.fromBytes(bytes);
        const pair = try Ecdsa.KeyPair.fromSecretKey(secret_key);
        return Self{
            ._pair = pair,
            ._chain = [_]u8{0} ** 32,
            ._depth = 0,
            ._index = 0,
            ._parent_id = [_]u8{0} ** 4,
            ._testnet = false,
        };
    }

    pub fn fromSeed(seed: [64]u8, testnet: bool) !Self {
        var I: [Hmac.mac_length]u8 = undefined;
        Hmac.create(&I, &seed, "Bitcoin seed");
        const secret_key = try Ecdsa.SecretKey.fromBytes(I[0..32].*);
        const pair = try Ecdsa.KeyPair.fromSecretKey(secret_key);
        return Self{
            ._pair = pair,
            ._chain = I[32..].*,
            ._depth = 0,
            ._index = 0,
            ._parent_id = [_]u8{0} ** 4,
            ._testnet = testnet,
        };
    }

    pub fn fromHexSeed(seed: [128]u8, testnet: bool) !Self {
        var res: [64]u8 = undefined;
        _ = try std.fmt.hexToBytes(&res, &seed);
        return Self.fromSeed(res, testnet);
    }

    pub fn fromWif(wif_bytes: [wif_length]u8) !Self {
        var fb = std.io.fixedBufferStream(&wif_bytes);
        const r = fb.reader();

        const testnet = switch (try r.readByte()) {
            0x80 => false,
            0xEF => true,
            else => return error.UnknownWifNet,
        };
        var secret_key_bytes: [32]u8 = undefined;
        _ = try r.read(&secret_key_bytes);
        _ = try r.readByte(); // compression byte

        var checksum: [4]u8 = undefined;
        _ = try r.read(&checksum);
        var calculated_checksum: [Sha256.digest_length]u8 = undefined;
        doubleSha256(wif_bytes[0..34], &calculated_checksum);
        for (checksum, calculated_checksum[0..4].*) |a, b| {
            if (a != b) {
                return error.InvalidChecksum;
            }
        }

        const secret_key = try Ecdsa.SecretKey.fromBytes(secret_key_bytes);
        const pair = try Ecdsa.KeyPair.fromSecretKey(secret_key);

        return .{
            ._pair = pair,
            ._chain = [_]u8{0} ** 32,
            ._depth = 0,
            ._index = 0,
            ._parent_id = [_]u8{0} ** 4,
            ._testnet = testnet,
        };
    }

    pub fn fromHexWif(wif_bytes: [wif_length * 2]u8) !Self {
        var bytes: [wif_length]u8 = undefined;
        _ = try std.fmt.hexToBytes(&bytes, &wif_bytes);
        return fromWif(bytes);
    }

    pub fn publicKey(self: Self) Ecdsa.PublicKey {
        return self._pair.public_key;
    }

    pub fn publicKeyCompressed(self: Self) [public_key_length]u8 {
        return self._pair.public_key.toCompressedSec1();
    }

    pub fn identifier(self: Self) [identifier_length]u8 {
        return hash160(&self.publicKeyCompressed());
    }

    pub fn derive(self: Self, index: u32, hardened: bool) !Self {
        var data: [37]u8 = undefined;
        var _index = index;
        if (hardened) {
            _index += min_hardened;
            data[0] = 0;
            data[1..33].* = self._pair.secret_key.toBytes();
        } else {
            data[0..33].* = self.publicKeyCompressed();
        }
        std.mem.writeInt(u32, data[33..37], _index, .Big);
        var I: [Hmac.mac_length]u8 = undefined;
        Hmac.create(&I, &data, &self._chain);
        const IL = std.mem.readInt(u256, I[0..32], .Big);
        if (IL >= n) {
            return self.derive(index + 1, hardened);
        }
        const ki = try std.math.add(u264, IL, std.mem.readInt(
            u256,
            &self._pair.secret_key.toBytes(),
            .Big,
        )) % n;
        if (ki == 0) {
            return self.derive(index + 1, hardened);
        }
        var secret_key_bytes: [32]u8 = undefined;
        std.mem.writeInt(
            u256,
            &secret_key_bytes,
            @as(u256, @intCast(ki)),
            .Big,
        );
        const secret_key = Ecdsa.SecretKey.fromBytes(
            secret_key_bytes,
        ) catch unreachable;
        return Self{
            ._pair = try Ecdsa.KeyPair.fromSecretKey(secret_key),
            ._chain = I[32..].*,
            ._depth = self._depth + 1,
            ._index = _index,
            ._parent_id = self.identifier()[0..4].*,
            ._testnet = self._testnet,
        };
    }

    pub fn sign(
        self: Self,
        msg: []const u8,
        noise: ?[Ecdsa.noise_length]u8,
    ) !Ecdsa.Signature {
        return self._pair.sign(msg, noise);
    }

    pub fn serialized(self: Self, out: *[serialized_length]u8, public: bool) void {
        var fb = std.io.fixedBufferStream(out);
        const writer = fb.writer();
        writer.writeInt(
            u32,
            @intFromEnum(
                Version.get(public, self._testnet),
            ),
            .Big,
        ) catch unreachable;
        writer.writeByte(self._depth) catch unreachable;
        _ = writer.write(self._parent_id[0..4]) catch unreachable;
        writer.writeInt(u32, self._index, .Big) catch unreachable;
        _ = writer.write(&self._chain) catch unreachable;
        if (public) {
            _ = writer.write(&self.publicKeyCompressed()) catch unreachable;
        } else {
            writer.writeByte(0) catch unreachable;
            _ = writer.write(&self._pair.secret_key.toBytes()) catch unreachable;
        }
        var checksum: [32]u8 = undefined;
        Sha256.hash(out[0..78], &checksum, .{});
        Sha256.hash(&checksum, &checksum, .{});
        _ = writer.write(checksum[0..4]) catch unreachable;
    }

    pub fn serializedHex(self: Self, public: bool) [serialized_length * 2]u8 {
        var data: [serialized_length]u8 = undefined;
        self.serialized(&data, public);
        return std.fmt.bytesToHex(data, .lower);
    }
};

test "BIP-84 vector" {
    var key = try ExtendedKey.fromHexSeed(
        "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4".*,
        false,
    );
    try std.testing.expectEqualStrings(
        "04b2430c0000000000000000007923408dadd3c7b56eed15567707ae5e5dca089de972e07f3b860450e2a3b70e001837c1be8e2995ec11cda2b066151be2cfb48adf9e47b151d46adab3a21cdf67766d8fa2",
        &key.serializedHex(false),
    );
    try std.testing.expectEqualStrings(
        "04b247460000000000000000007923408dadd3c7b56eed15567707ae5e5dca089de972e07f3b860450e2a3b70e03d902f35f560e0470c63313c7369168d9d7df2d49bf295fd9fb7cb109ccee049479bf7eca",
        &key.serializedHex(true),
    );

    key = try key.derive(84, true);
    key = try key.derive(0, true);
    const root = try key.derive(0, true);
    try std.testing.expectEqualStrings(
        "04b2430c037ef32bdb800000004a53a0ab21b9dc95869c4e92a161194e03c0ef3ff5014ac692f433c4765490fc00e14f274d16ca0d91031b98b162618061d03930fa381af6d4caf44b01819ab6d433e90f23",
        &root.serializedHex(false),
    );
    try std.testing.expectEqualStrings(
        "04b24746037ef32bdb800000004a53a0ab21b9dc95869c4e92a161194e03c0ef3ff5014ac692f433c4765490fc02707a62fdacc26ea9b63b1c197906f56ee0180d0bcf1966e1a2da34f5f3a09a9b2a963110",
        &root.serializedHex(true),
    );

    const rec = try root.derive(0, false);

    key = try rec.derive(0, false);
    try std.testing.expectEqualStrings(
        "c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2",
        &std.fmt.bytesToHex(key.identifier(), .lower),
    );

    key = try rec.derive(1, false);
    try std.testing.expectEqualStrings(
        "9c90f934ea51fa0f6504177043e0908da6929983",
        &std.fmt.bytesToHex(key.identifier(), .lower),
    );

    key = try root.derive(1, false);
    key = try key.derive(0, false);
    try std.testing.expectEqualStrings(
        "3e34985dca6fddc9fb369940e4c7d8e2873f529c",
        &std.fmt.bytesToHex(key.identifier(), .lower),
    );
}
