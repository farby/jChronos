var pendientes = [];
var tmpPendientes = [];
var tpoMarca;

function login(user, pass) {
  var ok = false;
  $.soap({
    url: "http://mateo0407-001-site1.atempurl.com/averificousuariows.aspx",
    method: "VerificoUsuarioWS.Execute",
    appendMethodToURL: false,
    async: false,
    withCredentials: false,
    data: {
      Usuariows: 'OclockApp',
      Passwordws: '0cl0ck4pp',
      Cedula: user,
      Password: pass
    },
    namespaceQualifier: "o",
    namespaceURL: "OClock",
    enableLogging: true,
    success: function (SOAPResponse) {
      if ($(SOAPResponse.toXML()).find("Success").text() == "true") {
          localStorage.setItem("usuario", user);
          localStorage.setItem("nombre", $(SOAPResponse.toXML()).find("Nombre").text());
          localStorage.setItem("apellido", $(SOAPResponse.toXML()).find("Apellido").text());
          localStorage.setItem("tpoFuncionario", $(SOAPResponse.toXML()).find("Tipofuncionario").text());
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

function marcar(tpoMarca) {
    var user = localStorage.getItem("usuario");
    var fh = new Date();
    var fecha = "";
    fecha = fh.toISOString().split("T")[0];
    var hora = "";
    hora = fh.toISOString().split("T")[1].split(".")[0].substr(0,5);
    var marca = {
        Usuariows: "OclockApp",
        Passwordws: "0cl0ck4pp",
        Cedula: user,
        Fecha: fecha,
        Hora: hora,
        Latitud: 0,
        Longitud: 0,
        Tipomarca: tpoMarca
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
        }
        function error() {
            toastr.alert("No se logró obtener la geolocalización.");
			$.mobile.loading("hide");
			sndMarca(marca, true);
        }
		var options = {
		  enableHighAccuracy: true,
		  timeout: 30000,
		  maximumAge: 60000
		};
        $.mobile.loading("show", {
            text: "geolocalizando",
            textVisible: true
        });
        navigator.geolocation.getCurrentPosition(success, error, options);
    }
}

function sndMarca(marca, dsp) {
	$.mobile.loading("show", {
		text: "marcando",
		textVisible: true
	});
    var ok = false;
    $.soap({
        url: "http://mateo0407-001-site1.atempurl.com/acargomarcasws.aspx",
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

function sndMarcas() {
	$.mobile.loading("show", {
		text: "sincronizando",
		textVisible: true
	});
	tmpPendientes = [];
	pendientes.forEach(
		function(marca, i, marcas) {
			sndMarca(marca, false);
		}
	);
	pendientes = tmpPendientes;
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

function dspDatosUsuario() {
	if (localStorage.getItem("usuario").length > 0) {
		$("#lblNombre").html(localStorage.getItem("nombre") + " " + localStorage.getItem("apellido"));
		$("#lblHoy").html("¡Hola " + localStorage.getItem("nombre") + " " + localStorage.getItem("tpoFuncionario") + "!");
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
}

function dspAgenda(agenda) {
	$("#lstAgenda").html("");
	agenda.forEach(
		function(turno, i, agenda) {
			dspTurno(turno);
		}
	);
}

function dspTurno(turno) {
	//ENCABEZADO
	$("#lstAgenda").append("<li data-role='list-divider' role='heading' class='ui-li-divider ui-bar-inherit ui-li-has-count ui-first-child'>" + turno.FechaInicio + "<span class='ui-li-count ui-body-inherit'>" + turno.HoraInicio + " - " + turno.HoraFin + "</span></li>");
	//CUERPO
	$("#lstAgenda").append("<li><a href='' class='ui-btn ui-btn-icon-right ui-icon-carat-r'><h2>" + "</h2><p><strong>" + turno.LugarNombre + "(" + turno.Calle + " " + turno.Numero + ")</strong></p></a></li>");
}
	
function getAgenda(fecha, hoy) {
	var yy = parseInt(fecha.substr(0, 4));
	var mm = parseInt(fecha.substr(5, 2));
	var user = localStorage.getItem("usuario");
	var fechaInicio = new Date(yy, mm - 1, 1);
	var fechaFin;
	if (!hoy) {
		fechaFin = new Date(yy, mm, 0);
	}
	var turnos;
 	$.soap({
		url: "http://mateo0407-001-site1.atempurl.com/arevisaagendaws.aspx",
		method: "revisaagendaws.Execute",
		appendMethodToURL: false,
		async: false,
		withCredentials: false,
		data: {
			Usuariows: 'OclockApp',
			Passwordws: '0cl0ck4pp',
			Cedula: user,
			Fechainicio: fechaInicio,
			Fechafin: fechaFin
		},
		namespaceQualifier: "o",
		namespaceURL: "OClock",
		enableLogging: true,
		success: function (SOAPResponse) {
		  if ($(SOAPResponse.toXML()).find("Success").text() == "true") {
			  turnos = $(SOAPResponse.toXML()).find("SDTTurnoIndividualItem");
			  alert(turnos.text());
			  alert(turnos.find("SocioNom").text());
			  localStorage.setItem("turnos", turnos);
			  localStorage.setItem("resp", SOAPResponse);
			  dspAgenda($(SOAPResponse.toXML()).find("Sdtturnoindividual"));
		  } else {
			  alert($(SOAPResponse.toXML()).find("Mensaje"));
			  toastr.error("Mes y/o año incorrectos.");
		  }
		},
		error: function() {
		  toastr.warning("No se logró establecer conexión con el servidor.");
		}
  });
	turnos.each(turnos, function(i, x) {
		alert("#"+i+": "+x.text());
	});
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
	dspTurno("turno");
}

$(document).ready(init);

function init() {
	localStorage.setItem("lstMarcas", "");
						 
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
	
	//BOTON INGRESAR
	$("#btnIngresar").click(
		function() {
			if (login(parseInt($("#txtUser").val()),""+$("#txtPass").val())) {
				dspDatosUsuario();
				location.href = "#pHoy";
			} else {
				location.href = "#pIngresar";
			}
		}
	);
	
	//BOTON SALIR
    $("#btnSalir").click(
        function() {
			sndMarcas();
            localStorage.removeItem("usuario");
            localStorage.removeItem("nombre");
            localStorage.removeItem("apellido");
            localStorage.removeItem("tpoFuncionario");
            location.href = "#pIngresar";
        }
	);
	
	//BOTON AYUDA
	$("#btnAyuda").click(
		function () {
			login(47422625,"1");
			location.href = "#pHoy";
		}
	);
	
	//MOSTRAR DATOS DEL USUARIO
	dspDatosUsuario();
	
	//BOTON MARCAR
	updBtnMarcar();
	$("#btnMarcar").click(
		function() {
			marcar(tpoMarca);
		}
	);
	
	//BOTON OBTENER AGENDA
	$("#btnGetAgenda").click(
		function() {
			getAgenda($("#txtMes").val(), false);
		}
	);
}