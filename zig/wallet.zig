const std = @import("std");

const ExtendedKey = @import("./extk.zig").ExtendedKey;
const tx = @import("./tx.zig");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const alloc = gpa.allocator();
var extk: ?ExtendedKey = null;
var isTestNet = false;

extern fn ret(pointer: usize, length: usize) void;
extern fn ask(pointer: usize, length: usize) void;
extern fn err(pointer: usize, length: usize) void;

fn throwError(message: []const u8) void {
    const memory = alloc.alloc(u8, message.len) catch {
        @panic("failed to allocate memory");
    };
    defer alloc.free(memory);
    @memcpy(memory, message);
    err(@intFromPtr(memory.ptr), memory.len);
}

fn createExtendedKey(seed: *[64]u8) !void {
    var key = try ExtendedKey.fromSeed(seed.*, isTestNet);
    key = try key.derive(84, true);
    key = try key.derive(@intFromBool(isTestNet), true);
    key = try key.derive(0, true);
    key = try key.derive(0, false);
    extk = try key.derive(0, false);
}

export fn init(testnet: bool) void {
    if (extk) |key| {
        _ = key;
        return throwError("failed to init: already initialized");
    }
    const seed = alloc.alloc(u8, 64) catch {
        @panic("failed to allocate memory");
    };
    defer alloc.free(seed);
    ask(@intFromPtr(seed.ptr), seed.len);
    isTestNet = testnet;
    createExtendedKey(@ptrCast(seed)) catch |_error| throwError(@errorName(_error));
}

export fn getIdentifier() void {
    if (extk) |key| {
        const id = alloc.alloc(u8, ExtendedKey.identifier_length) catch {
            @panic("failed to allocate memory");
        };
        defer alloc.free(id);
        @memcpy(id, &key.identifier());
        ret(@intFromPtr(id.ptr), id.len);
    } else {
        throwError("failed to get identifier: wallet is not initialized");
    }
}

fn getRandom(out: *[tx.Input.random_len]u8) void {
    const random = alloc.alloc(
        u8,
        tx.Input.random_len,
    ) catch @panic("failed to allocate memory");
    defer alloc.free(random);
    ask(@intFromPtr(random.ptr), tx.Input.random_len);
    @memcpy(out, random);
}

export fn signTx(unsigned_tx_length: usize, input_count: usize) void {
    if (extk) |key| {
        const tx_buf = alloc.alloc(
            u8,
            tx.Transaction.getMaxSize(
                unsigned_tx_length,
                input_count,
            ),
        ) catch @panic("failed to allocate memory");
        defer alloc.free(tx_buf);
        const amounts_len = input_count * 8;
        const amounts = alloc.alloc(
            u8,
            amounts_len,
        ) catch @panic("failed to allocate memory");
        defer alloc.free(amounts);

        ask(@intFromPtr(tx_buf.ptr), unsigned_tx_length);
        ask(@intFromPtr(amounts.ptr), amounts_len);

        var transaction = tx.Transaction.init(
            alloc,
            key,
            tx_buf,
            amounts,
        ) catch |_error| return throwError(@errorName(_error));
        defer transaction.deinit();
        transaction.sign(
            getRandom,
        ) catch |_error| return throwError(@errorName(_error));
        // tx.verify() catch |_error| return throwError(@errorName(_error));
        ret(@intFromPtr(tx_buf.ptr), transaction.tx_end);
    } else {
        throwError("failed to sign transaction: wallet is not initialized");
    }
}
