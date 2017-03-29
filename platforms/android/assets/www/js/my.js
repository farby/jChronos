var wsUser;
var wsPass;
var wsUrl;
var pendientes = [];
var tmpPendientes = [];
var tpoMarca;
var hayTurnos;

function config() {
	$.getJSON("js/config.json", function(config) {
		wsUser = config["wsUser"];
		wsPass = config["wsPass"];
		wsUrl = config["wsUrl"];
		telAyuda = config["telAyuda"];
	});
	toastr.options = {
		"closeButton": false,
		"debug": false,
		"newestOnTop": false,
		"progressBar": false,
		"positionClass": "toast-top-full-width",
		"preventDuplicates": true,
		"onclick": null,
		"showDuration": "200",
		"hideDuration": "200",
		"timeOut": "2000",
		"extendedTimeOut": "1000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	};
	localStorage.setItem("lstMarcas", "");
}

function logout() {
	localStorage.removeItem("usuario");
	localStorage.removeItem("contrasena");
	localStorage.removeItem("nombre");
	localStorage.removeItem("apellido");
	localStorage.removeItem("tpoFuncionario");
	localStorage.removeItem("lstMarcas");
	localStorage.setItem("ultMarca", "0");
	localStorage.setItem("recordar", "No");
}

function login(user, pass) {
  var ok = false;
  $.soap({
	url: wsUrl + "averificousuariows.aspx",
	method: "VerificoUsuarioWS.Execute",
	appendMethodToURL: false,
	async: false,
	withCredentials: false,
	data: {
	  Usuariows: wsUser,
	  Passwordws: wsPass,
	  Cedula: user,
	  Password: pass
	},
	namespaceQualifier: "o",
	namespaceURL: "OClock",
	enableLogging: true,
	success: function (SOAPResponse) {
	  if ($(SOAPResponse.toXML()).find("Success").text() == "true") {
		  localStorage.setItem("usuario", user);
		  localStorage.setItem("contrasena", pass);
		  localStorage.setItem("nombre", $(SOAPResponse.toXML()).find("Nombre").text());
		  localStorage.setItem("apellido", $(SOAPResponse.toXML()).find("Apellido").text());
		  localStorage.setItem("tpoFuncionario", $(SOAPResponse.toXML()).find("Tipofuncionario").text());
		  localStorage.setItem("recordar", $("#swcRecordar").val());
		  toastr.success("¡Bienvenid@!");
		ok = true;
	  } else {
		  toastr.error("Usuario y/o contraseña incorrectos.");
	  }
	},
	error: function() {
	  toastr.warning("No se logró establecer conexión con el servidor.");
	}
  });
  return ok;
}

//MARCAR
function marcar(tpoMarca) {
	var user = localStorage.getItem("usuario");
	var fh = new Date();
	var fecha = "";
	fecha = fh.toISOString().split("T")[0];
	var hora = "";
	hora = fh.toISOString().split("T")[1].split(".")[0].substr(0,5);
	var turno = $("#lstHoy").val();
	var marca = {
		Usuariows: wsUser,
		Passwordws: wsPass,
		Cedula: user,
		Fecha: fecha,
		Hora: hora,
		Latitud: 0,
		Longitud: 0,
		Tipomarca: tpoMarca,
		Turnoid: turno
	};
	localStorage.setItem("ultMarca", tpoMarca);
	updBtnMarcar();
	geolocalizar(marca);
}

function geolocalizar(marca) {
	if (!navigator.geolocation) {
		toastr.error("Geolocalización no soportada.");
	} else {
		function success(position) {
			var latitude  = position.coords.latitude;
			var longitude = position.coords.longitude;
			var accuracy = position.coords.accuracy;
			marca.Latitud = latitude;
			marca.Longitud = longitude;
			navigator.vibrate(1000);
			$.mobile.loading("hide");
			sndMarca(marca, true);
			updMapa(latitude, longitude);
		}
		function error() {
			toastr.error("No se logró obtener la geolocalización.");
			$.mobile.loading("hide");
			sndMarca(marca, true);
		}
		var options = {
		  enableHighAccuracy: true,
		  timeout: 30000,
		  maximumAge: 5000
		};
		$.mobile.loading("show", {
			text: "geolocalizando",
			textVisible: true
		});
		navigator.geolocation.getCurrentPosition(success, error, options);
	}
}

function sndMarcas() {
	$.mobile.loading("show", {
		text: "sincronizando",
		textVisible: true
	});
	tmpPendientes = [];
	pendientes.forEach(function(marca, i, marcas) {
		sndMarca(marca, false);
	});
	pendientes = tmpPendientes;
	$.mobile.loading("hide");
}

function sndMarca(marca, dsp) {
	$.mobile.loading("show", {
		text: "marcando",
		textVisible: true
	});
	var ok = false;
	$.soap({
		url: wsUrl + "acargomarcasws.aspx",
		method: "CargoMarcasWS.Execute",
		appendMethodToURL: false,
		async: false,
		withCredentials: false,
		data: marca,
		namespaceQualifier: "o",
		namespaceURL: "Oclock",
		enableLogging: true,
		success: function (SOAPResponse) {
			if ($(SOAPResponse.toXML()).find("Success").text() == "true") {
				ok = true;
				toastr.success("Marca sincronizada correctamente.")
			} else {
				toastr.error("Error al sincronizar la marca. Póngase en contacto con un supervisor.");
			}
		},
		error: function() {
			toastr.warning("No se logró establecer conexión con el servidor. Se intentará luego.");
		}
	});
	if (dsp) {
		dspMarca(marca);
	}
	if (ok == false) {
		if (dsp) {
			pendientes.push(marca);
		} else {
			tmpPendientes.push(marca);
		}
	}
	$.mobile.loading("hide");
}

function dspMarca(marca) {
	if (marca != null) {
		localStorage.setItem("lstMarcas", localStorage.getItem("lstMarcas") + "<li><a class='ui-btn ui-btn-icon-left " + getTipoMarca(marca.Tipomarca) + ": " + marca.Hora + "hs (lat " + marca.Latitud + " lon " + marca.Longitud + ")</a></li>");
	}
	$("#lstMarcas").html("");
	$("#lstMarcas").append(localStorage.getItem("lstMarcas"));
}

function getTipoMarca(tpoMarca) {
	switch(tpoMarca) {
		case 1:
			return "ui-icon-carat-r'>Inicio jornada";
			break;
		case 2:
			return "ui-icon-carat-l'>Inicio descanso";
			break;
		case 3:
			return "ui-icon-carat-r'>Fin descanso";
			break;
		case 4:
			return "ui-icon-carat-l'>Fin jornada";
			break;
		default:
			return "'>Sin especificar";
	}
}

function getNombreTipoMarca(tpoMarca) {
	switch(tpoMarca) {
		case "1":
			return "Inicio de jornada";
			break;
		case "2":
			return "Inicio de descanso";
			break;
		case "3":
			return "Fin de descanso";
			break;
		case "4":
			return "Fin de jornada";
			break;
		default:
			return "Sin especificar";
	}
}
//MARCAR

//HOY
function dspDatosUsuario() {
	if (localStorage.getItem("usuario") != null) {
		$("#lblNombre").html(localStorage.getItem("nombre") + " " + localStorage.getItem("apellido"));
		$("#lblHoy").html("¡Hola " + localStorage.getItem("nombre") + " " + localStorage.getItem("apellido") + "!");
	}
}

function updBtnMarcar() {
	/*
	TIPOS DE MARCAS:
	1: iniciar jornada
	2: iniciar descanso
	3: finalizar descanso
	4: finalizar jornada

	TIPOS DE FUNCIONARIO:
	1: marca 1, 2, 3, 4
	2: marca 1, 4
	3: marca 1
	*/
	if (hayTurnos) {
		if (localStorage.getItem("dinamico") === "Si") {
			$("#grpEstatico").hide();
			$("#grpDinamico").show();
			var txtMarca = "";
			tpoMarca = -1;
			switch(parseInt(localStorage.getItem("tpoFuncionario"))) {
				case 1:
					switch(parseInt(localStorage.getItem("ultMarca"))) {
						case 0:
							txtMarca = "Iniciar jornada";
							tpoMarca = 1;
							break;
						case 1:
							txtMarca = "Iniciar descanso";
							tpoMarca = 2;
							break;
						case 2:
							txtMarca = "Finalizar descanso";
							tpoMarca = 3;
							break;
						case 3:
							txtMarca = "Finalizar jornada";
							tpoMarca = 4;
							break;
						default:
							txtMarca = "Iniciar jornada";
							tpoMarca = 1;
							break;
					}
					break;
				case 2:
					switch(ultMarca) {
						case 0:
							txtMarca = "Iniciar jornada";
							tpoMarca = 1;
							break;
						case 1:
							txtMarca = "Finalizar jornada";
							tpoMarca = 4;
							break;
						default:
							txtMarca = "Iniciar jornada";
							tpoMarca = 1;
							break;
					}
					break;
				case 3:
					txtMarca = "Registrar actividad";
					tpoMarca = 1;
					break;
			}
			$("#btnMarcar").html(txtMarca);
		} else {
			$("#grpDinamico").hide();
			$("#grpEstatico").show();
		}
	} else {
		$("#grpDinamico").hide();
		$("#grpEstatico").hide();
	}
}

function rfsHoy() {
	var hoy = new Date();
	var strHoy = hoy.getFullYear() + "-";
	if (hoy.getMonth() + 1 < 10) { strHoy += "0"; }
	strHoy += (hoy.getMonth()+1) + "-";
	if (hoy.getDate() + 1 < 10) { strHoy += "0"; }
	strHoy += (hoy.getDate());
	getAgenda(strHoy, true);
}
//HOY

//AGENDA
function getAgenda(fecha, hoy) {
	console.log(">getAgenda");
	var user = localStorage.getItem("usuario");
	var fechaInicio;
	var fechaFin;
	if (!hoy) {
		var yy = parseInt(fecha.substr(0, 4));
		var mm = parseInt(fecha.substr(5, 2));
		fechaInicio = new Date(yy, mm - 1, 1);
		fechaFin = new Date(yy, mm, 0);
	} else {
		fechaInicio = fecha;
		fechaFin = fecha;
	}
	console.log(">>fechaInicio " + fechaInicio);
	console.log(">>fechaFin " + fechaFin);
	console.log(">>hoy " + hoy.toString());
 	$.soap({
		url: wsUrl + "arevisaagendaws.aspx",
		method: "revisaagendaws.Execute",
		appendMethodToURL: false,
		async: true,
		withCredentials: false,
		data: {
			Usuariows: wsUser,
			Passwordws: wsPass,
			Cedula: user,
			Fechainicio: fechaInicio,
			Fechafin: fechaFin
		},
		namespaceQualifier: "o",
		namespaceURL: "OClock",
		enableLogging: true,
		success: function (SOAPResponse) {
			console.log(">>>succes");
			var agenda = new Array();
			hayTurnos = false;
			if ($(SOAPResponse.toXML()).find("Success").text() === "true") {
				$(SOAPResponse.toXML()).find("SDTTurnoIndividualItem").each(function() {
					agenda.push($(this));
				});
				hayTurnos = true;
			} else {
				if (!hoy) {
					toastr.error("Mes y/o año incorrectos.");
				}
			}
			if (hoy) {
				dspTurnosHoy(agenda);
			} else {
				dspTurnosAgenda(agenda);
			}
		},
		error: function() {
			console.log(">>>error");
			toastr.warning("No se logró establecer conexión con el servidor.");
		}
	});
}

function dspTurnosHoy(agenda) {
	$("#lstHoy").html("");
	if(agenda.length < 1) {
		$("#lstHoy").html("<option value='-1'>No hay turnos disponibles</option>");
	} else {
		for(var i = 0; i < agenda.length; i++) {
			$("#lstHoy").append("<option value='" + agenda[i].find("TurnoId").text() + "'>Inicio: " + agenda[i].find("FechaInicio").text() + " " + agenda[i].find("HoraInicio").text() + " Fin: " + agenda[i].find("FechaFin").text() + " " + agenda[i].find("HoraFin").text() + "</option>");
		}
	}
	//$("#lstHoy").selectmenu().trigger('create');
	$("#lstHoy").selectmenu().selectmenu("refresh", true);
	updBtnMarcar();
}

function dspTurnosAgenda(agenda) {
	$("#lstAgenda").html("");
	for(var i = 0; i < agenda.length; i++) {
		var turno = "<li data-role='list-divider'>" + agenda[i].find("FechaInicio").text() + "<span class='ui-li-count'>" + agenda[i].find("HoraInicio").text() + " - " + agenda[i].find("HoraFin").text() + "</span></li><li><a href='#pMarcas' name='" + agenda[i].find("TurnoId").text() + "'><h2></h2><p><strong>" + agenda[i].find("LugarNombre").text() + ": " + agenda[i].find("Calle").text() + " " + agenda[i].find("Numero").text() + "</strong></p>";
		$("#lstAgenda").append(turno).listview("refresh");
	}
	$("#lstAgenda li a").click(function() {
		getMarcasTurno($(this).attr("name"));
	});
}
//AGENDA

//MARCAS
function getMarcasTurno(turno) {
	console.log(">getMarcasTurno");
	console.log(">>turno " + turno.toString());
	$.mobile.loading("show", {
		text: "obteniendo marcas",
		textVisible: true
	});
	$.soap({
		url: wsUrl + "arevisamarcasws.aspx",
		method: "revisamarcasws.Execute",
		appendMethodToURL: false,
		async: false,
		withCredentials: false,
		data: {
			Usuariows: wsUser,
			Passwordws: wsPass,
			Turnoid: turno
		},
		namespaceQualifier: "o",
		namespaceURL: "OClock",
		enableLogging: true,
		success: function (SOAPResponse) {
			console.log(">>>success");
			if ($(SOAPResponse.toXML()).find("Success").text() === "true") {
				var marcas = new Array();
				$(SOAPResponse.toXML()).find("SDTMarcasItem").each(function() {
					marcas.push($(this));
				});
				dspMarcasTurno(marcas);
			} else {
				toastr.error("No hay marcas registradas para este turno.");
			}
		},
		error: function() {
			console.log(">>>error");
			toastr.warning("No se logró establecer conexión con el servidor.");
		}
	});
	$.mobile.loading("hide");
}

function dspMarcasTurno(marcas) {
	console.log(">dspMarcasTurno");
	console.log(">>cantidad " + marcas.length);
	$("#pMarcas h1").html(marcas[0].find("MarcaFecha").text());
	$("#lstTurnoMarcas").html("");
	for(var i = 0; i < marcas.length; i++) {
		var marca = "<div data-role='collapsible'><h3>" + getNombreTipoMarca(marcas[i].find("MarcaTipoId").text()) + ": " + marcas[i].find("MarcaHora").text() + "hs</h3><img width='" + ($(window).width() - 100).toString() + "' src='https://maps.googleapis.com/maps/api/staticmap?autoscale=false&size=" + ($(window).width() - 100).toString() + "x" + ($(window).width() - 200).toString() + "&maptype=roadmap&format=png&visual_refresh=true&markers=size:mid%7Ccolor:0xff0000%7Clabel:1%7C" + marcas[i].find("MarcaLatitud").text() + "," + marcas[i].find("MarcaLongitud").text() + "'></div>";
        $("#lstTurnoMarcas").append(marca);
	}
	$("#lstTurnoMarcas").collapsibleset().trigger('create');
}
//MARCAS

//MENSAJES
function getCanales(origen) {
	console.log(">getCanales");
	//local
	if (origen === 0) {
		console.log(">>local");
		$("#lstCanales").html(localStorage.getItem("canales"));
		getMensajes(0);
	//server
	} else {
	console.log(">>server");
		$.soap({
			url: wsUrl + "arevisacanalesws.aspx",
			method: "RevisaCanalesWs.Execute",
			appendMethodToURL: false,
			async: false,
			withCredentials: false,
			data: {
				Usuariows: wsUser,
				Passwordws: wsPass
			},
			namespaceQualifier: "o",
			namespaceURL: "OClock",
			enableLogging: true,
			success: function (SOAPResponse) {
				console.log(">>>success");
				var canales = new Array();
				if ($(SOAPResponse.toXML()).find("Success").text() === "true") {
					$(SOAPResponse.toXML()).find("SDTCanalesItem").each(function() {
						canales.push($(this));
					});
					dspCanales(canales);
					getMensajes(1);
				} else {
					toastr.error("No hay canales disponibles.");
				}
			},
			error: function() {
				console.log(">>>error");
				toastr.warning("No se logró establecer conexión con el servidor.");
			}
		});
	}
}

function dspCanales(canales) {
	console.log(">dspCanales");
	console.log(">>cantidad " + canales.length);
	if (canales.length > 0) {
		$("#lstCanales").html("");
		for (var i = 0; i < canales.length; i++) {
			$("#lstCanales").append("<option value='" + canales[i].find("CanalId").text() + "'>" + canales[i].find("CanalNombre").text() + "</option>");
		}	
		$("#lstCanales").selectmenu().trigger('create');
		//$("#lstCanales").selectmenu("refresh", true);
		$("#lstCanales").change(function() {
			getMensajes(1);
		});
		localStorage.setItem("canales", $("#lstCanales").html());
	}
}

function getMensajes(origen) {
	console.log(">getMensajes");
	//local
	if (origen === 0) {
		console.log(">>local");
		$("#txtMensajes").val(localStorage.getItem("msgCanal" + $("#lstCanales").val()));
		console.log("msgCanal" + $("#lstCanales").val());
	//server
	} else {
	console.log(">>server");
		$.soap({
			url: wsUrl + "arevisamensajesws.aspx",
			method: "RevisaMensajesWs.Execute",
			appendMethodToURL: false,
			async: false,
			withCredentials: false,
			data: {
				Usuariows: wsUser,
				Passwordws: wsPass,
				Cedula: localStorage.getItem("usuario"),
				Canalid: $("#lstCanales").val()
			},
			namespaceQualifier: "o",
			namespaceURL: "OClock",
			enableLogging: true,
			success: function (SOAPResponse) {
				console.log(">>>success");
				var mensajes = new Array();
				if ($(SOAPResponse.toXML()).find("Success").text() === "true") {
					$(SOAPResponse.toXML()).find("SDTMensajesItem").each(function() {
						mensajes.push($(this));
					});
				} else {
					toastr.error("No hay mensajes en este canal.");
				}
				dspMensajes(mensajes);
			},
			error: function() {
				console.log(">>>error");
				toastr.warning("No se logró establecer conexión con el servidor.");
			}
		});
	}
}

function dspMensajes(mensajes) {
	console.log(">dspMensajes");
	console.log(">>cantidad " + mensajes.length);
	$("#txtMensajes").val("");
	for(var i = 0; i < mensajes.length; i++) {
		$("#txtMensajes").val($("#txtMensajes").val() + mensajes[i].find("MensajesEnviadoPorNom").text() + " - " + mensajes[i].find("MensajesFecha").text() + " " + mensajes[i].find("MensajesHora").text() + ":\n" + mensajes[i].find("MensajesMensaje").text() + "\n");
	}
	localStorage.setItem("msgCanal" + $("#lstCanales").val(), $("#txtMensajes").val());
}

function dspMensaje() {
	if ($("#txtMensaje").val().trim() != "") {
		var hoy = new Date();
		if (hoy.getDate() + 1 < 10) { strHoy += "0"; }
		var strHoy = hoy.getDate() + "/";
		if (hoy.getMonth() + 1 < 10) { strHoy += "0"; }
		strHoy += (hoy.getMonth() + 1) + "/";
		strHoy += hoy.getFullYear() + " ";
		if (hoy.getHours() < 10) { strHoy += "0"; }
		strHoy += hoy.getHours() + ":";
		if (hoy.getMinutes() < 10) { strHoy += "0"; }
		strHoy += hoy.getMinutes();
		var mensaje = $("#txtMensaje").val().trim();
		$("#txtMensajes").val($("#txtMensajes").val() + "Yo - " + strHoy + ":\n" + mensaje + "\n");
		sndMensaje(mensaje);
	}
	$("#txtMensaje").val("");
}

function sndMensaje(mensaje) {
	$.mobile.loading("show", {
		text: "enviando mensaje",
		textVisible: true
	});
	$.soap({
		url: wsUrl + "aenviomensajesws.aspx",
		method: "EnvioMensajesWs.Execute",
		appendMethodToURL: false,
		async: false,
		withCredentials: false,
		data: {
			Usuariows: wsUser,
			Passwordws: wsPass,
			Cedula: localStorage.getItem("usuario"),
			Canal: parseInt($("#lstCanales").val()),
			Mensajes: mensaje
		},
		namespaceQualifier: "o",
		namespaceURL: "OClock",
		enableLogging: true,
		success: function (SOAPResponse) {
			if ($(SOAPResponse.toXML()).find("Success").text() === "true") {
				getMensajes(1);
			} else {
				toastr.error("Error al enviar mensaje.");
			}
		},
		error: function() {
			toastr.warning("No se logró establecer conexión con el servidor.");
		}
	});
	$.mobile.loading("hide");
}
//MENSAJES

$(document).ready(init);
/*$(document).on('pageinit', function(){
	init();
});*/

//INIT
function init() {
	config();
	if (localStorage.getItem("canales") === null) {
		localStorage.setItem("canales", "");
	}
	//MODO DINAMICO
	if (localStorage.getItem("dinamico") === null) {
		localStorage.setItem("dinamico", "No");
		$("#swcModo").val("No");
	} else {
		if (localStorage.getItem("dinamico") === "Si") {
			$("#swcModo").val("Si");
		} else {
			$("#swcModo").val("No");
		}
	}

	//AUTO INGRESO
	if (localStorage.getItem("recordar") === "Si" && localStorage.getItem("usuario") != null) {
		location.href = "#pHoy";
		dspDatosUsuario();
		getCanales(0);
		setTimeout(function() {
			rfsHoy();
		}, 500);
	}

	//BOTON INGRESAR
	$("#btnIngresar").click(function() {
		if (login(parseInt($("#txtUser").val()), "" + $("#txtPass").val())) {
			location.href = "#pHoy";
			dspDatosUsuario();
			getCanales(1);
			rfsHoy();
		} else {
			location.href = "#pIngresar";
		}
	});

	//BOTON GUARDAR PERFIL
	$("#btnGuardar").click(
		function() {
			localStorage.setItem("dinamico", $("#swcModo").val());
			updBtnMarcar();
			location.href = "#pHoy";
		}
	);

	//BOTON SALIR
	$("#btnSalir").click(
		function() {
			sndMarcas();
			logout();
			location.href = "#pIngresar";
		}
	);

	//BOTON AYUDA
	$("#btnAyuda").click(
		function () {
			location.href = "tel:" + telAyuda;
		}
	);

	//BOTON MARCAR
	updBtnMarcar();
	$("#btnMarcar").click(
		function() {
			marcar(tpoMarca);
		}
	);
	$("#btnMarca1").click(
		function() {
			marcar(1);
		}
	);
	$("#btnMarca2").click(
		function() {
			marcar(2);
		}
	);
	$("#btnMarca3").click(
		function() {
			marcar(3);
		}
	);
	$("#btnMarca4").click(
		function() {
			marcar(4);
		}
	);
	$("#btnRecargar").click(
		function() {
			rfsHoy();
		}
	);

	//BOTON OBTENER AGENDA
	$("#btnGetAgenda").click(
		function() {
			getAgenda($("#txtMes").val(), false);
		}
	);

	//COMO IR
	$("#iframe").height($(window).height() - 107);
    
	//CANALES / MENSAJES
	$("#rfsMensajes").click(function() {
		getCanales(1); //0 = local | 1 = server
	});

	$("#txtMensajes").height($(window).height() - 325);
	/*$("#btndspMensaje").click(function() {
		dspMensaje();
	});*/
	$("#txtMensaje").keypress(function(k) {
		if(k.which == 13) {
			dspMensaje();
		}
	});
	//REFRESH
	$("#rfsHoy").click(function() {
		rfsHoy();
		updBtnMarcar();
	});


	//LOGIN FOCUS
	$("#txtUser").focusout(function() {
		$("#txtPass").focus();
	});
	$("#txtPass").focusout(function() {
		$("#btnIngresar").focus();
	});
	$("#btnIngresar").focusout(function() {
		$("#btnAyuda").focus();
	});
	
}