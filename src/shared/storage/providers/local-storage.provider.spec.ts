import { LocalStorageProvider } from '@shared/storage/providers/local-storage.provider.ts'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockStorage = {
	get: vi.fn(),
	set: vi.fn(),
	remove: vi.fn(),
	clear: vi.fn(),
}

vi.stubGlobal('browser', { storage: { local: mockStorage } })

describe('local storage provider', () => {
	let provider: LocalStorageProvider

	beforeEach(() => {
		vi.clearAllMocks()
		provider = new LocalStorageProvider()
	})

	describe('get', () => {
		it('should return null when key is absent', async () => {
			mockStorage.get.mockResolvedValue({})
			expect(await provider.get<string>('missing')).toBeNull()
		})

		it('should return typed value when key exists', async () => {
			mockStorage.get.mockResolvedValue({ theme: 'dark' })
			expect(await provider.get<string>('theme')).toBe('dark')
		})

		it('should return null when stored value is undefined', async () => {
			mockStorage.get.mockResolvedValue({ config: undefined })
			expect(await provider.get<Record<string, unknown>>('config')).toBeNull()
		})
	})

	describe('getMany', () => {
		it('should return partial record with existing keys', async () => {
			mockStorage.get.mockResolvedValue({ a: 1, c: true })
			const result = await provider.getMany(['a', 'b', 'c'] as const)
			expect(result).toEqual({ a: 1, c: true })
		})

		it('should return empty object when no keys match', async () => {
			mockStorage.get.mockResolvedValue({})
			expect(await provider.getMany(['x', 'y'] as const)).toEqual({})
		})

		it('should forward requested keys to storage API', async () => {
			await provider.getMany(['key1', 'key2'] as const)
			expect(mockStorage.get).toHaveBeenCalledWith(['key1', 'key2'])
		})
	})

	describe('set', () => {
		it('should store value under specified key', async () => {
			await provider.set('settings', { lang: 'en' })
			expect(mockStorage.set).toHaveBeenCalledWith({ settings: { lang: 'en' } })
		})

		it('should handle primitive types', async () => {
			await provider.set('count', 42)
			expect(mockStorage.set).toHaveBeenCalledWith({ count: 42 })
		})
	})

	describe('remove', () => {
		it('should delete single key', async () => {
			await provider.remove('temp')
			expect(mockStorage.remove).toHaveBeenCalledWith('temp')
		})

		it('should delete multiple keys when array is provided', async () => {
			await provider.remove(['a', 'b'])
			expect(mockStorage.remove).toHaveBeenCalledWith(['a', 'b'])
		})
	})

	describe('clear', () => {
		it('should wipe all storage data', async () => {
			await provider.clear()
			expect(mockStorage.clear).toHaveBeenCalled()
		})
	})
})
