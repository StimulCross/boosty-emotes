export class Formatter {
	private static _numberFormatter = new Intl.NumberFormat('en-US')
	private static _dateFormatter = new Intl.DateTimeFormat('en-US')

	public static async init(): Promise<void> {
		const languages = await browser.i18n.getAcceptLanguages()

		this._numberFormatter = new Intl.NumberFormat(languages, {
			useGrouping: true,
		})

		this._dateFormatter = new Intl.DateTimeFormat(languages, {
			dateStyle: 'short',
			timeStyle: 'short',
		})
	}

	public static formatNumber(num: number): string {
		return this._numberFormatter.format(num)
	}

	public static formatDate(date: Date): string {
		return this._dateFormatter.format(date)
	}
}
