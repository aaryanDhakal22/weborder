// UI strings. A plain dictionary (no i18n library); store content carries its own *Es fields.
import type { Lang } from './types.ts';

const en = {
	home: 'Home', menu: 'Menu', deals: 'Deals', visit: 'Visit us', cart: 'Cart', account: 'Account', order: 'Order',
	delivery: 'Delivery', pickup: 'Pickup', pickupOnly: 'Pickup only', asap: 'ASAP', schedule: 'Schedule',
	openNow: 'Open now', closed: 'Closed', until: 'until {t}', opensAt: 'Opens {d} at {t}', today: 'today', tomorrow: 'tomorrow',
	startOrder: 'Start an order', orderPickup: 'Order for pickup', seeDeals: 'See deals', seeMenu: 'See the menu', allDeals: 'All deals', fullMenu: 'Full menu',
	popular: 'Popular', from: 'from', each: 'each', add: 'Add', addToOrder: 'Add to order', required: 'Required', optional: 'Optional',
	pick: 'Pick {n}', upTo: 'Up to {n}', pickAny: 'Pick any', notes: 'Notes for the kitchen', notesPh: 'Well done, please',
	hours: 'Hours', contact: 'Contact', deliveryArea: 'Delivery area · {mi} mi',
	yourOrder: 'Your order', items: '{n} items', viewOrder: 'View order', checkout: 'Checkout', goCheckout: 'Go to checkout',
	subtotal: 'Subtotal', tax: 'Tax', tip: 'Tip', deliveryFee: 'Delivery fee', serviceFee: 'Service fee', cardFee: 'Card fee ({p}%)', total: 'Total',
	savedYou: 'Deals saved you {m}', goesWith: 'Goes well with', promo: 'Promo code', apply: 'Apply',
	when: 'When', details: 'Your details', name: 'Name', phone: 'Phone (we call if something is wrong)', email: 'Email, optional, for the receipt',
	address: 'Street address', apt: 'Apt, suite, floor', zip: 'ZIP', driverNotes: 'Notes for the driver', tipDriver: 'Tip your driver', tipTeam: 'Tip the team', other: 'Other',
	payment: 'Payment', card: 'Card', cashDriver: 'Cash to the driver', cashPickup: 'Cash at pickup', cardNumber: 'Card number', exp: 'MM / YY', cvc: 'CVC',
	optIn: 'Send me deals from {s}. Stop anytime.', placeOrder: 'Place order', placing: 'Placing order…', paidVia: 'Paid to {s} through Stripe.',
	testCard: 'Test mode: 4242 4242 4242 4242 approves, 4000 0000 0000 0002 declines.',
	thanks: "Thanks, we're on it", orderNo: 'Your order', arrives: 'Arrives around', readyAt: 'Ready at', received: 'Order received', receivedSub: 'Sent to the kitchen',
	accepted: 'Accepted', acceptedSub: 'Kitchen #{n}', cooking: 'Cooking', cookingSub: 'Miso is on it', ready: 'Ready for pickup', readySub: 'Come to the counter',
	out: 'Out for delivery', outSub: "It's on the way", done: 'Delivered', doneP: 'Picked up', receipt: 'Receipt', paid: 'Paid', due: 'Due at the door',
	callStore: 'Something wrong? Call', homeScreen: 'Put {s} on your Home Screen', homeScreenSub: 'Reorder in two taps and get alerts when it leaves the kitchen.', showMe: 'Show me',
	installTitle: '{s} on your phone', installFree: 'Free · no app store', share: 'Tap Share', shareSub: "The square with an arrow, in Safari's bottom bar.",
	addHome: 'Choose “Add to Home Screen”', addHomeSub: "Scroll down the list if you don't see it.", openAlerts: 'Open {s} and turn on alerts', openAlertsSub: 'We only send updates about your orders.',
	androidNote: 'On Android, tap Install when your browser offers it.', notNow: 'Not now', gotIt: 'Got it',
	emptyCart: 'Your bowl is empty', emptyCartSub: 'Nothing in the order yet. The deals are a good place to start.', browse: 'Browse the menu',
	closedTitle: "We're closed", closedSub: 'We open {d} at {t}. Order ahead and we start it first thing.', orderAhead: 'Order ahead',
	pausedTitle: "Kitchen's slammed", pausedSub: 'Online orders are paused for a few minutes. Back around {t}.',
	busyTitle: "It's a busy one", busySub: 'Orders are taking about {n} minutes right now.',
	zoneTitle: "We can't reach that far… yet", zoneSub: 'That ZIP is outside our delivery area. Pickup works any time.', switchPickup: 'Switch to pickup',
	payFail: 'Your card said no', payFailSub: 'Your bank declined the payment. Nothing was charged. Try another card or pay with cash.',
	lostTitle: 'Miso got lost in the menu', lostSub: "That page doesn't exist. The menu does, though.", backMenu: 'Back to the menu',
	soldOut: 'Sold out', soldOutSub: 'Someone got the last one.', change: 'Change', next: 'Next', addDeal: 'Add deal to order', youSave: 'You save', step: 'Step {a} of {b}',
	nowPicking: 'Now picking', dealDone: 'Deal complete!', thisWeek: 'This week', all: 'All', haveCode: 'Have a code? Add it at checkout.',
	language: 'Language', poweredBy: 'ordering by quicc', minutes: 'min', size: 'Size', whole: 'Whole', left: 'Left half', right: 'Right half',
	toppingsHint: 'Tap a topping, then whole or half', halvesSame: 'Halves cost the same.', back: 'Back', close: 'Close', remove: 'Remove', edit: 'Edit',
	scheduleFor: 'Schedule for', chooseTime: 'Choose a time', notOpenYet: 'Ordering opens when we do. You can schedule for later.',
	inZone: 'In the delivery area', updating: 'Updating total…', storeStatus: 'Store status', pausedBar: 'Online ordering is paused', busyBar: 'Busy: about {n} min',
	closedBar: 'Closed now · opens {d} {t}', offline: 'Online ordering is offline right now. Call us to order.'
};

type Dict = typeof en;

const es: Dict = {
	home: 'Inicio', menu: 'Menú', deals: 'Ofertas', visit: 'Visítanos', cart: 'Carrito', account: 'Cuenta', order: 'Pedido',
	delivery: 'Entrega', pickup: 'Recoger', pickupOnly: 'Solo para llevar', asap: 'Ya', schedule: 'Programar',
	openNow: 'Abierto', closed: 'Cerrado', until: 'hasta las {t}', opensAt: 'Abre {d} a las {t}', today: 'hoy', tomorrow: 'mañana',
	startOrder: 'Ordena ahora', orderPickup: 'Ordena para recoger', seeDeals: 'Ver ofertas', seeMenu: 'Ver el menú', allDeals: 'Ver todas', fullMenu: 'Menú completo',
	popular: 'Favorito', from: 'desde', each: 'cada uno', add: 'Agregar', addToOrder: 'Agregar', required: 'Requerido', optional: 'Opcional',
	pick: 'Elige {n}', upTo: 'Hasta {n}', pickAny: 'Elige los que quieras', notes: 'Notas para la cocina', notesPh: 'Bien dorado, por favor',
	hours: 'Horario', contact: 'Contacto', deliveryArea: 'Área de entrega · {mi} mi',
	yourOrder: 'Tu pedido', items: '{n} artículos', viewOrder: 'Ver pedido', checkout: 'Pagar', goCheckout: 'Ir a pagar',
	subtotal: 'Subtotal', tax: 'Impuesto', tip: 'Propina', deliveryFee: 'Envío', serviceFee: 'Cargo de servicio', cardFee: 'Cargo por tarjeta ({p}%)', total: 'Total',
	savedYou: 'Ahorraste {m}', goesWith: 'Va bien con', promo: 'Código', apply: 'Aplicar',
	when: 'Cuándo', details: 'Tus datos', name: 'Nombre', phone: 'Teléfono (te llamamos si algo pasa)', email: 'Correo, opcional, para el recibo',
	address: 'Dirección', apt: 'Apto, suite, piso', zip: 'Código postal', driverNotes: 'Notas para el repartidor', tipDriver: 'Propina', tipTeam: 'Propina', other: 'Otro',
	payment: 'Pago', card: 'Tarjeta', cashDriver: 'Efectivo al repartidor', cashPickup: 'Efectivo al recoger', cardNumber: 'Número de tarjeta', exp: 'MM / AA', cvc: 'CVC',
	optIn: 'Quiero recibir ofertas de {s}.', placeOrder: 'Hacer pedido', placing: 'Enviando…', paidVia: 'Pagas a {s} con Stripe.',
	testCard: 'Modo prueba: 4242 4242 4242 4242 aprueba, 4000 0000 0000 0002 rechaza.',
	thanks: 'Gracias, ya lo estamos haciendo', orderNo: 'Tu pedido', arrives: 'Llega alrededor de las', readyAt: 'Listo a las', received: 'Pedido recibido', receivedSub: 'Enviado a la cocina',
	accepted: 'Aceptado', acceptedSub: 'Cocina #{n}', cooking: 'En la cocina', cookingSub: 'Miso está en eso', ready: 'Listo para recoger', readySub: 'Pasa al mostrador',
	out: 'En camino', outSub: 'Ya va para allá', done: 'Entregado', doneP: 'Recogido', receipt: 'Recibo', paid: 'Pagado', due: 'A pagar al recibir',
	callStore: '¿Algún problema? Llama al', homeScreen: 'Pon {s} en tu pantalla de inicio', homeScreenSub: 'Vuelve a pedir en dos toques y recibe avisos.', showMe: 'Cómo',
	installTitle: '{s} en tu teléfono', installFree: 'Gratis · sin tienda de apps', share: 'Toca Compartir', shareSub: 'El cuadro con la flecha, abajo en Safari.',
	addHome: 'Elige “Agregar a inicio”', addHomeSub: 'Desliza la lista si no lo ves.', openAlerts: 'Abre {s} y activa los avisos', openAlertsSub: 'Solo te avisamos de tus pedidos.',
	androidNote: 'En Android, toca Instalar cuando aparezca.', notNow: 'Ahora no', gotIt: 'Listo',
	emptyCart: 'Tu pedido está vacío', emptyCartSub: 'Aún no hay nada. Las ofertas son un buen comienzo.', browse: 'Ver el menú',
	closedTitle: 'Estamos cerrados', closedSub: 'Abrimos {d} a las {t}. Ordena ahora y lo hacemos al abrir.', orderAhead: 'Ordenar para después',
	pausedTitle: 'La cocina está llena', pausedSub: 'Pausamos los pedidos en línea unos minutos. Volvemos como a las {t}.',
	busyTitle: 'Hay mucho trabajo', busySub: 'Los pedidos tardan unos {n} minutos ahora mismo.',
	zoneTitle: 'No llegamos tan lejos… todavía', zoneSub: 'Ese código postal está fuera del área de entrega. Puedes recoger en la tienda.', switchPickup: 'Cambiar a recoger',
	payFail: 'Tu tarjeta no pasó', payFailSub: 'El banco rechazó el pago. No se cobró nada. Prueba otra tarjeta o paga en efectivo.',
	lostTitle: 'Miso se perdió en el menú', lostSub: 'Esa página no existe. El menú sí.', backMenu: 'Volver al menú',
	soldOut: 'Agotado', soldOutSub: 'Alguien se llevó el último.', change: 'Cambiar', next: 'Siguiente', addDeal: 'Agregar al pedido', youSave: 'Ahorras', step: 'Paso {a} de {b}',
	nowPicking: 'Eligiendo', dealDone: '¡Oferta completa!', thisWeek: 'Esta semana', all: 'Todas', haveCode: '¿Tienes un código? Agrégalo al pagar.',
	language: 'Idioma', poweredBy: 'pedidos por quicc', minutes: 'min', size: 'Tamaño', whole: 'Entera', left: 'Mitad izquierda', right: 'Mitad derecha',
	toppingsHint: 'Toca un ingrediente, luego entera o mitad', halvesSame: 'Las mitades cuestan lo mismo.', back: 'Atrás', close: 'Cerrar', remove: 'Quitar', edit: 'Editar',
	scheduleFor: 'Programar para', chooseTime: 'Elige una hora', notOpenYet: 'Los pedidos abren cuando abrimos. Puedes programar para después.',
	inZone: 'Dentro del área de entrega', updating: 'Actualizando total…', storeStatus: 'Estado', pausedBar: 'Pedidos en línea en pausa', busyBar: 'Mucho trabajo: unos {n} min',
	closedBar: 'Cerrado · abre {d} {t}', offline: 'Los pedidos en línea no están disponibles. Llámanos para ordenar.'
};

const DICTS: Record<Lang, Dict> = { en, es };
export type Key = keyof Dict;

export function t(lang: Lang, key: Key, vars: Record<string, string | number> = {}): string {
	let s = (DICTS[lang] ?? en)[key] ?? en[key] ?? key;
	for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
	return s;
}

/** Picks a localized content field: tr(item, 'name', 'es') → item.nameEs ?? item.name. */
export function tr<T extends object>(obj: T, field: string, lang: Lang): string {
	const o = obj as Record<string, unknown>;
	const v = lang === 'en' ? o[field] : (o[field + lang[0].toUpperCase() + lang.slice(1)] ?? o[field]);
	return (v as string) ?? '';
}
