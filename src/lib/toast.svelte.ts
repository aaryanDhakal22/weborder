// One-line confirmations ("Added Garlic Naan"). Announced to screen readers.
class Toast {
	text = $state('');
	id = 0;
	show(text: string) {
		this.text = text;
		const id = ++this.id;
		setTimeout(() => {
			if (this.id === id) this.text = '';
		}, 2200);
	}
}
export const toast = new Toast();
