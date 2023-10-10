import PocketBase, { ClientResponseError } from 'pocketbase'

export interface User {
  id: number
  botCanWrite: boolean
}

export interface UsersRepository {
  getOrCreate(id: number, botCanWrite: boolean): Promise<User>
  update(data: User): Promise<void>
}

interface PocketBaseUser {
  id: string
  telegramId: number
  botCanWrite: boolean
  created: string
  updated: string
}

export class PocketBaseUsersRepository implements UsersRepository {
  protected readonly collection

  constructor(pocketBase: PocketBase) {
    this.collection = pocketBase.collection('users')
  }

  protected async getId(telegramId: number) {
    return (await this.collection.getFirstListItem(`telegramId="${telegramId}"`)).id
  }

  async getOrCreate(telegramId: number, botCanWrite: boolean) {
    try {
      const { botCanWrite } = await this.collection.getFirstListItem<PocketBaseUser>(
        `telegramId="${telegramId}"`
      )
      return { id: telegramId, botCanWrite }
    } catch (err) {
      if (!(err instanceof ClientResponseError)) throw err
      if (err.status !== 404) throw err
    }
    try {
      await this.collection.create<PocketBaseUser>({ telegramId, botCanWrite })
    } catch (err) {
      console.log(err)
      throw err
    }
    return { id: telegramId, botCanWrite }
  }

  async update(user: User) {
    const { id, botCanWrite } = user
    await this.collection.update(await this.getId(id), { botCanWrite })
  }
}
