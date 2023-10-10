import type { UsersRepository } from '$lib/server/users'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      usersRepository?: UsersRepository
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {}
