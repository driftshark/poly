const symbol = {
	/** @hidden */
	_symbols: {} as { [key: string]: {} },

	named: (name: string): symbol => {
		symbol._symbols[name] = symbol._symbols[name] ?? {};

		return symbol._symbols[name] as symbol;
	},
};

export = symbol;
