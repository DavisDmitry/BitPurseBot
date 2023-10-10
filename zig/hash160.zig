const std = @import("std");
const Sha256 = std.crypto.hash.sha2.Sha256;
const ripemd160 = @import(
    "./ripemd160.zig",
).ripemd160;

pub fn hash160(input: []const u8) [20]u8 {
    var sha256: [Sha256.digest_length]u8 = undefined;
    Sha256.hash(input, &sha256, .{});
    var ret: [20]u8 = undefined;
    ripemd160(&sha256, Sha256.digest_length, &ret);
    return ret;
}

test "test hash160" {
    var expected: [20]u8 = undefined;
    _ = try std.fmt.hexToBytes(
        &expected,
        "6482e5fdd6027c8e65962e8a39101c336d734af6",
    );
    _ = try std.testing.expectEqual(expected, hash160("qwerty"));
}
