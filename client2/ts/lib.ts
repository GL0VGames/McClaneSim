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