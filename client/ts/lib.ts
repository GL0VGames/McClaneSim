export class dom {
	// Similar to jquery's $("#thing")
	static get(query: string) {
		return document.querySelector(query) as HTMLElement;
	}
	// Prepend content to specified element
	static prepend(query: string, content: string) {
		let el = this.get(query);
		return el!.innerHTML = content + el!.innerHTML;
	}
	// Append content to specified element
	static append(query: string, content: string) {
		let el = this.get(query);
		return el!.innerHTML = el!.innerHTML + content;
	}
}

export class utils {
	// Remove an item from an array
	static arrayRemove (item: Object, arr: any[]) {
		arr.splice(arr.indexOf(item),1);
	}
	// Show the alert dialog and set appropriate colors, text, etc.
	static alert(status: string) {
		let alert = dom.get("#alert");
		alert.classList.remove("win", "lose");
		alert.classList.add(status);
		let alertBody = dom.get("#alertBody");
		if (status == "lose")
			alertBody.textContent = "You lose. Next time, try to avoid running out of health.";
		else if (status == "win")
			alertBody.textContent = "You win. Hans and Karl are dead and the hostages have been saved.";
		dom.get("#worldViewer").style.display = "none";
		alert.style.display = "initial";
	}
	// Get a random number excluding the upper bound
	static getRandomIntExc(min: number, max: number) {
		return this.getRandomInt(min, max-1);
	}
	// Get a random number including the upper bound
	// https://stackoverflow.com/a/18230432/2525751
	static getRandomInt(min: number, max: number): number {       
		// Create byte array and fill with 1 random number
		var byteArray = new Uint8Array(1);
		window.crypto.getRandomValues(byteArray);
	
		var range = max - min + 1;
		var max_range = 256;
		if (byteArray[0] >= Math.floor(max_range / range) * range)
			return this.getRandomInt(min, max);
		return min + (byteArray[0] % range);
	}
}