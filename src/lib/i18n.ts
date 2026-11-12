// UI strings. A plain dictionary (no i18n library). Menu names stay as the store wrote them.
import type { Lang } from './types.ts';

const en = {
	// navigation + frame
	home: 'Home', menu: 'Menu', deals: 'Deals', visit: 'Visit us', cart: 'Cart', account: 'Account', mainNav: 'Main', skip: 'Skip to content', breadcrumb: 'Breadcrumb',
	language: 'Language', poweredBy: 'ordering by quicc', signIn: 'Sign in', hi: 'Hi {n}',
	delivery: 'Delivery', pickup: 'Pickup', pickupOnly: 'Pickup only', deliveryOnly: 'Delivery only', asap: 'ASAP', schedule: 'Schedule',
	openNow: 'Open now', closed: 'Closed', until: 'until {t}', opensAt: 'Opens {d} at {t}', today: 'today', tomorrow: 'tomorrow', openAlways: 'Open',
	pausedBar: 'Online ordering is paused', backAround: 'back around {t}', offline: "Online ordering isn't reachable right now. Call us to order.",
	// home
	startOrder: 'Start an order', orderAhead: 'Order ahead', seeDeals: 'See deals', seeMenu: 'See the menu', allDeals: 'All deals', fullMenu: 'Full menu', howWant: 'How do you want it?',
	hours: 'Hours', contact: 'Contact', deliveryArea: 'Delivery area · {mi} mi',
	// menu + item
	popular: 'Popular', fromMenu: 'From the menu', from: 'from', each: 'each', add: 'Add', added: 'Added', addToOrder: 'Add to order', required: 'Required', choose: 'Choose one',
	pick: 'Pick {n}', upTo: 'Up to {n}', pickAny: 'Pick any', notes: 'Notes for the kitchen', notesPh: 'Well done, please', items: '{n} items',
	size: 'Size', whole: 'Whole', left: 'Left half', right: 'Right half', toppingsHint: 'Tap a topping, then whole or half.', less: 'One less', more: 'One more',
	soldOut: 'Sold out', back: 'Back', close: 'Close', remove: 'Remove', edit: 'Edit', change: 'Change',
	// deals
	thisWeek: 'This week', all: 'All', bundles: 'Bundles', automatic: 'Automatic', codes: 'Codes', filter: 'Filter', off: 'off', free: 'Free', code: 'Code',
	haveCode: 'Have a code? Add it at checkout.', noDeals: 'No deals right now', noDealsSub: 'Check back soon. The menu is all here.', notNowDeal: 'Not right now',
	dealOff: "This deal isn't on right now.", next: 'Next', addDeal: 'Add deal to order', youSave: 'You save', step: 'Step {a} of {b}', nowPicking: 'Now picking',
	dealDone: 'Deal complete!', buildAnother: 'Build another', included: '{n} included', usually: 'usually', nothingFits: 'Nothing on the menu fits this step right now.',
	useCode: 'Use code {c} at checkout.', minSubtotal: 'on orders over {m}', appliesItself: 'It applies by itself in your cart. These count:', deal: 'Deal',
	coupon: 'Coupon', couponsFor: 'Coupons for your order', applyCoupon: 'Apply', removeCoupon: 'Remove coupon', couponGone: 'A coupon no longer fits your order: it was taken off.',
	// cart
	yourOrder: 'Your order', viewOrder: 'View order', checkout: 'Checkout', goCheckout: 'Go to checkout', goesWith: 'Goes well with',
	subtotal: 'Subtotal', tax: 'Tax', tip: 'Tip', deliveryFee: 'Delivery fee', serviceFee: 'Service fee', cardFee: 'Card fee ({p}%)', total: 'Total', savedYou: 'Deals saved you {m}', promo: 'Promo code',
	emptyCart: 'Your order is empty', emptyCartSub: 'Nothing in it yet. Start with the menu.', browse: 'Browse the menu',
	// checkout
	haveAccount: 'Have an account? Sign in for your saved addresses and cards.', when: 'When', day: 'Day', chooseTime: 'Choose a time', loadingTimes: 'Finding times…', loading: 'Loading…',
	noTimes: 'No times left that day. Try another day.', notOpenYet: "We're closed right now. Schedule it for when we open.", pausedSchedule: 'Online orders are paused. You can schedule for later.',
	details: 'Your details', name: 'Name', phone: 'Phone (we call if something is wrong)', phoneShort: 'Phone', email: 'Email, for the receipt (optional)',
	orderNotes: 'Notes for the order', orderNotesPh: 'Anything we should know?',
	address: 'Street address', apt: 'Apt, suite, floor', city: 'City', zip: 'ZIP', driverNotes: 'Notes for the driver', driverNotesPh: 'Side door, ring twice',
	newAddress: 'Another address', savedAddresses: 'Saved addresses', checkingArea: 'Checking the delivery area…', weDeliver: 'We deliver here.',
	didYouMean: 'Did you mean one of these?', addressNotFound: "We couldn't find that address. Check the street and ZIP.", pickupAt: 'Pick up at {a}',
	zoneTitle: "We can't reach that far… yet", zoneSub: "That's outside our delivery area. Pickup works any time.", switchPickup: 'Switch to pickup',
	tipDriver: 'Tip your driver', tipTeam: 'Tip the team', custom: 'Custom', noTip: 'No tip', tipLater: 'A tip written on your receipt may be charged to this card.',
	payment: 'Payment', card: 'Card', cashDriver: 'Cash to the driver', cashPickup: 'Pay at pickup', savedCards: 'Saved cards', newCard: 'A new card', expires: 'expires {d}',
	saveCard: 'Save this card for next time', holdNote: "Your card is held now and charged when your order is done, so a tip can still be added.",
	cardLoading: 'Loading the card form…', fakeSquare: 'Test card (fake Square)', testCardLabel: 'Test card (no Square connected)',
	placeOrder: 'Place order', placing: 'Placing order…', payTo: 'You pay {s} through Square.', fillIn: 'Please fill in: {f}', tryAgain: 'Something went wrong. Please try again.',
	payFail: 'Your card said no', verifyFailed: "Your bank couldn't confirm the card. Nothing was charged.", priceChanged: 'Prices changed', checkThis: 'Check this',
	stillConfirming: 'Still confirming your order', stillConfirmingSub: "We've sent it to the restaurant and are waiting for their answer. Don't place it again: this page updates by itself.",
	notPlaced: "Not placed — you weren't charged", backToCheckout: 'Back to checkout', callStoreAt: 'Call {p}',
	kitchenOfflineTitle: 'The kitchen is offline', kitchenOffline: "The kitchen can't take online orders right now. Please call the store.", kitchenOfflineSchedule: 'You can still order for later (an hour or more from now).',
	closedTitle: "We're closed", pausedTitle: "Kitchen's slammed",
	// tracking
	thanks: "Thanks, we're on it", orderNo: 'Your order', arrives: 'Arrives around', readyAt: 'Ready at', waitingAccept: 'Waiting for the kitchen to accept it.',
	scheduled: 'Scheduled', scheduledFor: 'For {t}', received: 'Order received', receivedSub: 'Sent to the kitchen', accepted: 'Accepted', acceptedSub: 'Kitchen #{n}', cookingSub: 'In the kitchen',
	ready: 'Ready for pickup', readySub: 'Come to the counter', readyOut: 'Ready', readyOutSub: 'Waiting for a driver', out: 'Out for delivery', outSub: "It's on the way", onTheWay: '{n} is on the way',
	done: 'Delivered', doneP: 'Picked up', doneShort: 'Done', cancelledShort: 'Cancelled', cancelledTitle: 'Order cancelled', cancelledSub: 'This order was cancelled. Any card hold is released.',
	trackSaved: 'Keep this page: it updates by itself. The link is in your email receipt too.',
	homeScreen: 'Put {s} on your Home Screen', homeScreenSub: 'Reorder in two taps.', showMe: 'Show me', installTitle: '{s} on your phone', installFree: 'Free · no app store',
	share: 'Tap Share', shareSub: "The square with an arrow, in Safari's bottom bar.", addHome: 'Choose “Add to Home Screen”', addHomeSub: "Scroll down the list if you don't see it.",
	androidNote: 'On Android, tap Install when your browser offers it.', gotIt: 'Got it',
	// account
	signInWhy: 'Sign in with your phone to keep your addresses and cards and to reorder in two taps.', phoneOnly: 'Phone', textMeCode: 'Text me a code',
	codeSent: 'We sent a code to {p}.', nameNew: 'Your name (new accounts)', changeNumber: 'Change number', callMe: 'Call me instead', callIn: 'Call me instead ({s}s)',
	guestOk: 'No account needed: you can always order as a guest.', emailShort: 'Email', emailReceipts: 'Email, for receipts', save: 'Save', cancel: 'Cancel',
	pastOrders: 'Your orders', noOrders: 'No orders yet.', track: 'Track', reorder: 'Reorder', reorderNothing: 'Nothing from that order is on the menu any more.',
	reorderDropped: 'Not on the menu any more: {x}. The rest is in your cart.', default: 'Default', noAddresses: 'No saved addresses yet.', label: 'Label', labelPh: 'Home, Work…',
	makeDefault: 'Use this address by default', noCards: 'Cards you save at checkout show up here.', forget: 'Forget', forgetCardQ: 'Forget this card?',
	signOut: 'Sign out', deleteAccount: 'Delete my account', deleteQ: 'Delete your account, saved addresses and cards? Past orders stay with the store.',
	// errors
	lostTitle: 'Miso got lost in the menu', lostSub: "That page doesn't exist. The menu does, though.", backMenu: 'Back to the menu', minutes: 'min',
	// Store › Website: preview, blocks, privacy
	previewBar: 'Preview of your draft · only you can see this until you publish', privacy: 'Privacy',
	orderAgain: 'Order again', categories: 'What are you in the mood for?', getApp: 'Get the app', getAppSub: 'Free, no app store: tap Share, then Add to Home Screen.',
	privacyTitle: 'Privacy policy'
};

type Dict = typeof en;

const es: Dict = {
	home: 'Inicio', menu: 'Menú', deals: 'Ofertas', visit: 'Visítanos', cart: 'Carrito', account: 'Cuenta', mainNav: 'Principal', skip: 'Ir al contenido', breadcrumb: 'Ruta',
	language: 'Idioma', poweredBy: 'pedidos por quicc', signIn: 'Entrar', hi: 'Hola {n}',
	delivery: 'Entrega', pickup: 'Recoger', pickupOnly: 'Solo para recoger', deliveryOnly: 'Solo entrega', asap: 'Lo antes posible', schedule: 'Programar',
	openNow: 'Abierto', closed: 'Cerrado', until: 'hasta las {t}', opensAt: 'Abre {d} a las {t}', today: 'hoy', tomorrow: 'mañana', openAlways: 'Abierto',
	pausedBar: 'Pedidos en línea en pausa', backAround: 'volvemos como a las {t}', offline: 'Los pedidos en línea no responden ahora. Llámanos para ordenar.',
	startOrder: 'Ordena ahora', orderAhead: 'Ordenar para después', seeDeals: 'Ver ofertas', seeMenu: 'Ver el menú', allDeals: 'Ver todas', fullMenu: 'Menú completo', howWant: '¿Cómo lo quieres?',
	hours: 'Horario', contact: 'Contacto', deliveryArea: 'Área de entrega · {mi} mi',
	popular: 'Favorito', fromMenu: 'Del menú', from: 'desde', each: 'cada uno', add: 'Agregar', added: 'Agregado', addToOrder: 'Agregar', required: 'Requerido', choose: 'Elige uno',
	pick: 'Elige {n}', upTo: 'Hasta {n}', pickAny: 'Elige los que quieras', notes: 'Notas para la cocina', notesPh: 'Bien dorado, por favor', items: '{n} artículos',
	size: 'Tamaño', whole: 'Entera', left: 'Mitad izquierda', right: 'Mitad derecha', toppingsHint: 'Toca un ingrediente, luego entera o mitad.', less: 'Uno menos', more: 'Uno más',
	soldOut: 'Agotado', back: 'Atrás', close: 'Cerrar', remove: 'Quitar', edit: 'Editar', change: 'Cambiar',
	thisWeek: 'Esta semana', all: 'Todas', bundles: 'Paquetes', automatic: 'Automáticas', codes: 'Códigos', filter: 'Filtrar', off: 'de descuento', free: 'Gratis', code: 'Código',
	haveCode: '¿Tienes un código? Agrégalo al pagar.', noDeals: 'No hay ofertas ahora', noDealsSub: 'Vuelve pronto. Todo el menú está aquí.', notNowDeal: 'Ahora no',
	dealOff: 'Esta oferta no está disponible ahora mismo.', next: 'Siguiente', addDeal: 'Agregar al pedido', youSave: 'Ahorras', step: 'Paso {a} de {b}', nowPicking: 'Eligiendo',
	dealDone: '¡Oferta completa!', buildAnother: 'Armar otra', included: '{n} incluido', usually: 'normal', nothingFits: 'Nada del menú sirve para este paso ahora.',
	useCode: 'Usa el código {c} al pagar.', minSubtotal: 'en pedidos de más de {m}', appliesItself: 'Se aplica sola en el carrito. Estos cuentan:', deal: 'Oferta',
	coupon: 'Cupón', couponsFor: 'Cupones para tu pedido', applyCoupon: 'Aplicar', removeCoupon: 'Quitar cupón', couponGone: 'Un cupón ya no cabe en tu pedido: se quitó.',
	yourOrder: 'Tu pedido', viewOrder: 'Ver pedido', checkout: 'Pagar', goCheckout: 'Ir a pagar', goesWith: 'Va bien con',
	subtotal: 'Subtotal', tax: 'Impuesto', tip: 'Propina', deliveryFee: 'Envío', serviceFee: 'Cargo de servicio', cardFee: 'Cargo por tarjeta ({p}%)', total: 'Total', savedYou: 'Ahorraste {m}', promo: 'Código',
	emptyCart: 'Tu pedido está vacío', emptyCartSub: 'Aún no hay nada. Empieza por el menú.', browse: 'Ver el menú',
	haveAccount: '¿Tienes cuenta? Entra para usar tus direcciones y tarjetas.', when: 'Cuándo', day: 'Día', chooseTime: 'Elige una hora', loadingTimes: 'Buscando horas…', loading: 'Cargando…',
	noTimes: 'No quedan horas ese día. Prueba otro día.', notOpenYet: 'Ahora estamos cerrados. Prográmalo para cuando abramos.', pausedSchedule: 'Los pedidos en línea están en pausa. Puedes programar para después.',
	details: 'Tus datos', name: 'Nombre', phone: 'Teléfono (te llamamos si algo pasa)', phoneShort: 'Teléfono', email: 'Correo, para el recibo (opcional)',
	orderNotes: 'Notas del pedido', orderNotesPh: '¿Algo que debamos saber?',
	address: 'Dirección', apt: 'Apto, suite, piso', city: 'Ciudad', zip: 'Código postal', driverNotes: 'Notas para el repartidor', driverNotesPh: 'Puerta lateral, toca dos veces',
	newAddress: 'Otra dirección', savedAddresses: 'Direcciones guardadas', checkingArea: 'Revisando el área de entrega…', weDeliver: 'Entregamos aquí.',
	didYouMean: '¿Quisiste decir una de estas?', addressNotFound: 'No encontramos esa dirección. Revisa la calle y el código postal.', pickupAt: 'Recoge en {a}',
	zoneTitle: 'No llegamos tan lejos… todavía', zoneSub: 'Está fuera del área de entrega. Puedes recoger en la tienda.', switchPickup: 'Cambiar a recoger',
	tipDriver: 'Propina para el repartidor', tipTeam: 'Propina para el equipo', custom: 'Otra', noTip: 'Sin propina', tipLater: 'Una propina escrita en tu recibo se puede cobrar a esta tarjeta.',
	payment: 'Pago', card: 'Tarjeta', cashDriver: 'Efectivo al repartidor', cashPickup: 'Paga al recoger', savedCards: 'Tarjetas guardadas', newCard: 'Otra tarjeta', expires: 'vence {d}',
	saveCard: 'Guardar esta tarjeta para la próxima', holdNote: 'Reservamos el monto ahora y lo cobramos al terminar el pedido, así todavía se puede agregar propina.',
	cardLoading: 'Cargando el formulario de tarjeta…', fakeSquare: 'Tarjeta de prueba (Square falso)', testCardLabel: 'Tarjeta de prueba (sin Square)',
	placeOrder: 'Hacer pedido', placing: 'Enviando…', payTo: 'Pagas a {s} con Square.', fillIn: 'Falta: {f}', tryAgain: 'Algo salió mal. Inténtalo de nuevo.',
	payFail: 'Tu tarjeta no pasó', verifyFailed: 'Tu banco no confirmó la tarjeta. No se cobró nada.', priceChanged: 'Cambiaron los precios', checkThis: 'Revisa esto',
	stillConfirming: 'Aún confirmando tu pedido', stillConfirmingSub: 'Lo enviamos al restaurante y esperamos su respuesta. No lo vuelvas a pedir: esta página se actualiza sola.',
	notPlaced: 'No se hizo el pedido — no se te cobró', backToCheckout: 'Volver al pago', callStoreAt: 'Llama al {p}',
	kitchenOfflineTitle: 'La cocina está desconectada', kitchenOffline: 'La cocina no puede recibir pedidos en línea ahora. Llama a la tienda, por favor.', kitchenOfflineSchedule: 'Aún puedes pedir para más tarde (dentro de una hora o más).',
	closedTitle: 'Estamos cerrados', pausedTitle: 'La cocina está llena',
	thanks: 'Gracias, ya lo estamos haciendo', orderNo: 'Tu pedido', arrives: 'Llega alrededor de las', readyAt: 'Listo a las', waitingAccept: 'Esperando que la cocina lo acepte.',
	scheduled: 'Programado', scheduledFor: 'Para las {t}', received: 'Pedido recibido', receivedSub: 'Enviado a la cocina', accepted: 'Aceptado', acceptedSub: 'Cocina #{n}', cookingSub: 'En la cocina',
	ready: 'Listo para recoger', readySub: 'Pasa al mostrador', readyOut: 'Listo', readyOutSub: 'Esperando al repartidor', out: 'En camino', outSub: 'Ya va para allá', onTheWay: '{n} va en camino',
	done: 'Entregado', doneP: 'Recogido', doneShort: 'Listo', cancelledShort: 'Cancelado', cancelledTitle: 'Pedido cancelado', cancelledSub: 'Este pedido se canceló. Cualquier reserva en tu tarjeta se libera.',
	trackSaved: 'Guarda esta página: se actualiza sola. El enlace también está en tu recibo por correo.',
	homeScreen: 'Pon {s} en tu pantalla de inicio', homeScreenSub: 'Vuelve a pedir en dos toques.', showMe: 'Cómo', installTitle: '{s} en tu teléfono', installFree: 'Gratis · sin tienda de apps',
	share: 'Toca Compartir', shareSub: 'El cuadro con la flecha, abajo en Safari.', addHome: 'Elige “Agregar a inicio”', addHomeSub: 'Desliza la lista si no lo ves.',
	androidNote: 'En Android, toca Instalar cuando aparezca.', gotIt: 'Listo',
	signInWhy: 'Entra con tu teléfono para guardar direcciones y tarjetas y volver a pedir en dos toques.', phoneOnly: 'Teléfono', textMeCode: 'Envíame un código',
	codeSent: 'Enviamos un código al {p}.', nameNew: 'Tu nombre (cuentas nuevas)', changeNumber: 'Cambiar número', callMe: 'Llámame', callIn: 'Llámame ({s}s)',
	guestOk: 'No necesitas cuenta: siempre puedes pedir como invitado.', emailShort: 'Correo', emailReceipts: 'Correo, para recibos', save: 'Guardar', cancel: 'Cancelar',
	pastOrders: 'Tus pedidos', noOrders: 'Aún no hay pedidos.', track: 'Seguir', reorder: 'Pedir de nuevo', reorderNothing: 'Nada de ese pedido está en el menú ahora.',
	reorderDropped: 'Ya no está en el menú: {x}. Lo demás está en tu carrito.', default: 'Principal', noAddresses: 'Aún no hay direcciones guardadas.', label: 'Nombre', labelPh: 'Casa, Trabajo…',
	makeDefault: 'Usar esta dirección por defecto', noCards: 'Las tarjetas que guardes al pagar aparecen aquí.', forget: 'Olvidar', forgetCardQ: '¿Olvidar esta tarjeta?',
	signOut: 'Salir', deleteAccount: 'Borrar mi cuenta', deleteQ: '¿Borrar tu cuenta, direcciones y tarjetas? Los pedidos pasados se quedan con la tienda.',
	lostTitle: 'Miso se perdió en el menú', lostSub: 'Esa página no existe. El menú sí.', backMenu: 'Volver al menú', minutes: 'min',
	previewBar: 'Vista previa del borrador · solo tú la ves hasta que publiques', privacy: 'Privacidad',
	orderAgain: 'Pedir otra vez', categories: '¿Qué se te antoja?', getApp: 'Descarga la app', getAppSub: 'Gratis, sin tienda de apps: toca Compartir y luego Agregar a inicio.',
	privacyTitle: 'Política de privacidad'
};

const DICTS: Record<Lang, Dict> = { en, es };
export type Key = keyof Dict;

export function t(lang: Lang, key: Key, vars: Record<string, string | number> = {}): string {
	let s = (DICTS[lang] ?? en)[key] ?? en[key] ?? key;
	for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
	return s;
}
