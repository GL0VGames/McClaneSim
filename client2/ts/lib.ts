export class dom {
	static get(query: string) {
		return document.querySelector(query) as HTMLElement;
	}
	static prepend(query: string, content: string) {
		let el = this.get(query);
		return el!.innerHTML = content + el!.innerHTML;
	}
	static append(query: string, content: string) {
		let el = this.get(query);
		return el!.innerHTML = el!.innerHTML + content;
	}
}

export class utils {
	static arrayRemove (item: Object, arr: any[]) {
		arr.splice(arr.indexOf(item),1);
	}
	static getRandomIntExc(min: number, max: number) {
		return this.getRandomInt(min, max-1);
	}
	static alert(status: string) {
		let alert = dom.get("#alert");
		alert.classList.add(status);
		if (status == "lose")
			alert.textContent = "You lose. Next time, try to avoid running out of health.";
		else if (status == "win")
			alert.textContent = "You win. Hans and Karl are dead and the hostages have been saved.";
		dom.get("#worldViewer").style.display = "none";
		alert.style.display = "initial";
	}
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