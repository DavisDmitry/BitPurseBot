const Sha256 = @import("std").crypto.hash.sha2.Sha256;

pub fn doubleSha256(b: []const u8, out: *[Sha256.digest_length]u8) void {
    Sha256.hash(b, out, .{});
    Sha256.hash(out, out, .{});
}
