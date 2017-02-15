var marcas = [];
var pendientes = [];

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
        Tipomarca: 1
    };
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
            sndMarcas(marca);
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

function sndMarcas(m) {
    //var tmp = [];
    //pendientes.forEach(function(m) {
    $.soap({
        url: "http://mateo0407-001-site1.atempurl.com/acargomarcasws.aspx",
        method: "CargoMarcasWS.Execute",
        appendMethodToURL: false,
        async: false,
        withCredentials: false,
        data: m,
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
    dspMarca(m);
    //});
    //pendientes = tmp;
}

function dspMarca(marca) {
    $("#lstMarcas").append('<li data-theme="e" class="ui-li-has-icon"><a data-transition="none" href="" class="ui-btn ui-btn-e"><img src="" class="ui-li-icon">' + marca.Tipomarca + ': ' + marca.Hora + 'hs | lat ' + marca.Latitud + ' lon ' + marca.Longitud + '</a></li>');
}
/*

    enviarMarca(marca);
    //marcas.push(marca);
    //setMarcasHoy();
}

function enviarMarca(marca) {
    
    $("#lstMarcas").append(
    '<li data-theme="e" class="ui-li-has-icon"><a data-transition="none" href="" class="ui-btn ui-btn-e"><img src="" class="ui-li-icon">asdasdasda </a></li>');
    //setMarcasHoy();
}

function geolocalizar() {
  var output = document.getElementById("out");

  if (!navigator.geolocation){
      toastr.error("Geolocalización no soportada.");
    }

    function success(position) {
      var latitude  = position.coords.latitude;
      var longitude = position.coords.longitude;
        var accuracy = position.coords.accuracy;
        navigator.vibrate(3000);
        
      marcar(latitude, longitude, accuracy, 1);
      toastr.success("Marca registrada correctamente.");
      $.mobile.loading('hide');
      //output.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';

      //var img = new Image();
      //img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=false";

      //output.appendChild(img);
    }

    function error() {
        marcar(0, 0, -1, 1);
      toastr.error("No se logró obtener la geolocalización.");
      $.mobile.loading('hide');
    }

    $.mobile.loading('show', {
    	text: 'geolocalizando',
    	textVisible: true
    });

    navigator.geolocation.getCurrentPosition(success, error);
}

function getTipoMarca(tpo) {
    switch(tpo) {
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

//function dspMarcasHoy() {
    $.each(marcas, function(i, m) {
        var tipo = getTipoMarca(m[i].Tipomarca);
        $("#lstMarcas").append('<li data-theme="e" class="ui-li-has-icon"><a data-transition="none" href="" class="ui-btn ui-btn-e"><img src="" class="ui-li-icon">' + tipo + ': ' + m[i].Hora + 'hs | lat ' + m[i].Latitud + ' lon ' + m[i].Longitud + '</a></li>');
    });
}

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
   // getMarcasHoy();
   // dspMarcasHoy();
                              
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
  }
  $("#btnIngresar").click(
    function() {
      if (login(parseInt($("#txtUser").val()),""+$("#txtPass").val())) {
          
          
          $("#lblNombre").html(localStorage.getItem("nombre")+" "+localStorage.getItem("apellido"));
          
          location.href = "#pHoy";
      }
  });
    $("#btnSalir").click(
        function() {
            localStorage.removeItem("usuario");
            localStorage.removeItem("nombre");
            localStorage.removeItem("apellido");
            localStorage.removeItem("tipo");
            location.href = "#pIngresar";
        });
  $("#btnMarcar").click(
    function() {
      marcar(1);
    }
  );
  if (localStorage.getItem("usuario").length > 0) {
      location.href = "#pHoy";
    }
}