export class Hook<T extends (...args: any) => any> {
	public listeners: Record<string, T> = {}

	/**
	 * Adds a new listener to this hook
	 */
	public add(identifier: string, listener: T) {
		this.listeners[identifier] = listener
	}

	/**
	 * Adds a new listener to this hook before any other existing listeners
	 */
	public addBefore(identifier: string, listener: T) {
		const currentInstances = Object.keys(this.listeners)
		const currentListeners = Object.values(this.listeners) as Array<T>
		currentInstances.unshift(identifier)
		currentListeners.unshift(listener)

		this.listeners = currentInstances.reduce(
			(result: Record<string, T>, currentInstance, index) => {
				result[currentInstance] = currentListeners[index]
				return result
			},
			{}
		)
	}

	/**
	 * Removes the specified listener
	 */
	public remove(identifier: string) {
		delete this.listeners[identifier]
	}

	/**
	 * Calls all the added listeners. Returns an array of the results
	 */
	public call(...params: Parameters<T>) {
		const results: Array<ReturnType<T>> = []
		const hooks = Object.values(this.listeners)
		for (let i = 0; i < hooks.length; i++) {
			const result = hooks[i](...(params as Array<any>))
			if (result !== undefined) {
				results.push(result)
			}
		}

		return results
	}
}

/**
 * Custom hook class for the game, derived from the generic custom hook class.
 *
 * Allows adding and removing listeners with the card instance as a reference, and calling all or some of the listeners.
 */
export class GameHook<T extends (...args: any) => any> extends Hook<(...args: any) => any> {
	// These are overriden so we can call the param instance instead of identifier
	public override add(instance: string, listener: T) {
		super.add(instance, listener)
	}
	public override addBefore(instance: string, listener: T) {
		super.addBefore(instance, listener)
	}
	public override remove(instance: string) {
		super.remove(instance)
	}
	public override call(...params: Parameters<T>) {
		const results: Array<ReturnType<T>> = []
		const hooks = Object.values(this.listeners)
		for (let i = 0; i < hooks.length; i++) {
			const result = hooks[i](...(params as Array<any>))
			if (result !== undefined) {
				results.push(result)
			}
		}

		return results
	}

	/**
	 * Calls only the listeners belonging to instances that pass the specified test
	 */
	public callSome(params: Parameters<T>, ignoreInstance: (instance: string) => boolean) {
		const results: Array<ReturnType<T>> = []
		const instances = Object.keys(this.listeners)
		const hooks = Object.values(this.listeners)
		for (let i = 0; i < instances.length; i++) {
			if (!ignoreInstance(instances[i])) {
				const result = hooks[i](...(params as Array<any>))
				if (result !== undefined) {
					results.push(result)
				}
			}
		}

		return results
	}
}

/**
 * Custom hook class that works the same as a regular hook, but also passes the first parameter through the listeners and returning it afterwards.
 *
 * Allows adding and removing listeners with the card instance as a reference, and calling all listeners while passing through the first parameter.
 */
export class WaterfallHook<T extends (...args: any) => Parameters<T>[0]> extends Hook<
	(...args: any) => any
> {
	// These are overriden so we can call the param instance instead of identifier
	public override add(instance: string, listener: T) {
		super.add(instance, listener)
	}
	public override addBefore(instance: string, listener: T) {
		super.addBefore(instance, listener)
	}
	public override remove(instance: string) {
		super.remove(instance)
	}

	public override call(...params: Parameters<T>): Parameters<T>[0] {
		const newParams = params
		const hooks = Object.values(this.listeners)
		for (let i = 0; i < hooks.length; i++) {
			newParams[0] = hooks[i](...(newParams as Array<any>))
		}

		return newParams[0]
	}
}
