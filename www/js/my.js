var marcas = [];
var pendientes = [];
var hay1;
var hay2;
var hay3;
var hay4;

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
          localStorage.setItem("tipo", $(SOAPResponse.toXML()).find("Tipofuncionario").text());
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

function marcar(tipo) {
    var user = localStorage.getItem("usuario");
    var fh = new Date();
    var fecha = "";
    fecha = fh.toISOString().split("T")[0];
    var hora = "";
    hora = fh.toISOString().split("T")[1].split(".")[0].substr(0,5);
    var marca = {
        Usuariows: 'OclockApp',
        Passwordws: '0cl0ck4pp',
        Cedula: user,
        Fecha: fecha,
        Hora: hora,
        Latitud: 0,
        Longitud: 0,
        Tipomarca: tipo
    };
	switch (tipo) {
		case 1:
			hay1 = true;
			break;
		case 2:
			hay2 = true;
			break;
		case 3:
			hay3 = true;
			break;
		case 4:
			hay4 = true;
			break;
	}
	updBtnMarcar();
    geolocalizar(marca);
    marcas.push(marca);
    pendientes.push(marca);
    //dspMarcas();
    //sndMarcas(marca);
    /*marcas.forEach(function(m) {
       $("#lstMarcas").append('<li data-theme="e" class="ui-li-has-icon"><a data-transition="none" href="" class="ui-btn ui-btn-e"><img src="" class="ui-li-icon">' + marca.Tipomarca + ': ' + marca.Hora + 'hs | lat ' + marca.Latitud + ' lon ' + marca.Longitud + '</a></li>'); 
    });*/
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
            $.mobile.loading('hide');
            toastr.success("Marca registrada correctamente.");
            navigator.vibrate(1000);
            sndMarcas(marca);
        }
        function error() {
            toastr.error("No se logró obtener la geolocalización.");
            $.mobile.loading('hide');
            sndMarca(marca);
        }
        $.mobile.loading('show', {
            text: 'geolocalizando',
            textVisible: true
        });
        navigator.geolocation.getCurrentPosition(success, error);
    }
}

/*function dspMarcas() {
    //$("#lstMarcas").html("");
    marcas.forEach(function(m) {
       $("#lstMarcas").append('<li data-theme="e" class="ui-li-has-icon"><a data-transition="none" href="" class="ui-btn ui-btn-e"><img src="" class="ui-li-icon">' + tipo + ': ' + m.Hora + 'hs | lat ' + m.Latitud + ' lon ' + m.Longitud + '</a></li>'); 
    });
}*/

function sndMarca(marca) {
    //var tmp = [];
    //pendientes.forEach(function(m) {
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
                toastr.success("Marca sincronizada correctamente.")
            } else {
                toastr.error("Error al sincronizar la marca. Póngase en contacto con un supervisor.");
            }
        },
        error: function() {
            //tmp.push(m);
            toastr.warning("No se logró establecer conexión con el servidor. Se intentará luego.");
        }
    });
    dspMarca(marca);
    //});
    //pendientes = tmp;
}

function dspMarca(marca) {
    $("#lstMarcas").append('<li data-theme="e" class="ui-li-has-icon"><a data-transition="none" href="" class="ui-btn ui-btn-e"><img src="" class="ui-li-icon">' + getTipoMarca(marca.Tipomarca) + ': ' + marca.Hora + "hs (lat " + marca.Latitud + " lon " + marca.Longitud + '</a></li>');
}

function getTipoMarca(tipo) {
    switch(tipo) {
        case 1:
            return "Entrada";
            break;
        case 2:
            return "Inicio descanso";
            break;
        case 3:
            return "Fin descanso";
            break;
        case 4:
            return "Salida";
            break;
        default:
            return "Sin especificar";
    }
}

function dspDatosUsuario() {
	if (localStorage.getItem("usuario").length > 0) {
		$("#lblNombre").html(localStorage.getItem("nombre") + " " + localStorage.getItem("apellido"));
		$("#lblHoy").html("Hola " + localStorage.getItem("nombre") + "!");
	}
}

function updBtnMarcar() {
	/*
	TIPOS DE MARCAS:
	1: iniciar jornada
	2: inicio descanso
	3: finalizar descanso
	4: finalizar jornada
	
	TIPOS DE FUNCIONARIO:
	1: marca 1, 2, 3, 4
	2: marca 1, 4
	3: marca 1
	*/
	var txtMarca;
	var tpoMarca;
	switch(parseInt(localStorage.getItem("tipo"))) {
		case 1:
			if (hay4) {
				txtMarca = "";
				tpoMarca = 0;
			} else if (hay3) {
				txtMarca = "Finalizar jornada";
				tpoMarca = 4;
			} else if (hay2) {
				txtMarca = "Finalizar descanso";
				tpoMarca = 3;
			} else if (hay1) {
				txtMarca = "Iniciar descanso";
				tpoMarca = 2;
			} else {
				txtMarca = "Iniciar jornada";
				tpoMarca = 1;
			}
			break;
		case 2:
			if (hay4) {
				txtMarca = "";
				tpoMarca = 0;
			} else if (hay1) {
				txtMarca = "Finalizar jornada";
				tpoMarca = 4;
			} else {
				txtMarca = "Iniciar jornada";
				tpoMarca = 1;
			}
			break;
		case 3:
			txtMarca = "Registrar actividad";
			tpoMarca = 1;
			break;
	}
	$("#btnMarcar").html(txtMarca);
	$("#btnMarcar").click(
		function() {
			marcar(tpoMarca);
		}
	);
}

/*


//function setMarcasHoy() {
    localStorage.setItem("marcas", marcas);
    localStorage.setItem("pendientes", pendientes);
}

//function getMarcasHoy() {
    marcas = JSON.stringify(eval("("+localStorage.getItem("marcas")+")"));
    pendientes = JSON.stringify(eval("("+localStorage.getItem("pendientes")+")"));
}*/

$(document).ready(init);

function init() {
	hay1 = false;
	hay2 = false;
	hay3 = false;
	hay4 = false;
	
	toastr.options = {
		"closeButton": false,
		"debug": false,
		"newestOnTop": false,
		"progressBar": true,
		"positionClass": "toast-top-full-width",
		"preventDuplicates": true,
		"onclick": null,
		"showDuration": "200",
		"hideDuration": "200",
		"timeOut": "3000",
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
            localStorage.removeItem("usuario");
            localStorage.removeItem("nombre");
            localStorage.removeItem("apellido");
            localStorage.removeItem("tipo");
            location.href = "#pIngresar";
        }
	);
	
	//BOTON MARCAR
	updBtnMarcar();
	
	//MOSTRAR DATOS DEL USUARIO
	dspDatosUsuario();
	
}