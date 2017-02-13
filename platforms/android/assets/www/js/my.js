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
        ok = true;
      }
    },
    error: function() {
      alert("error");
    }
  });
  return ok;
}

function marcar(lat, lon, acu) {
  var lt = ""+lat;
  var ln = ""+lon;
  $("#lstMarcas").append(
    '<li data-theme="e" class="ui-li-has-icon"><a data-transition="none" href="" class="ui-btn ui-btn-e"><img src="" class="ui-li-icon">'+lt.substring(0,7)+' '+ln.substring(0,7)+' '+acu+'m </a></li>'
  );
}

function geolocalizar() {
  var output = document.getElementById("out");

  if (!navigator.geolocation){
      toastr.error("Geolocalización no soportada.", "ERROR");
    }

    function success(position) {
      var latitude  = position.coords.latitude;
      var longitude = position.coords.longitude;
        var accuracy = position.coords.accuracy;

      marcar(latitude, longitude, accuracy);
      toastr.success("Marca registrada correctamente.");
      $.mobile.loading('hide');
      //output.innerHTML = '<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>';

      //var img = new Image();
      //img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=false";

      //output.appendChild(img);
    }

    function error() {
      toastr.error("No se logró obtener la geolocalización.");
      $.mobile.loading('hide');
    }

    $.mobile.loading('show', {
    	text: 'geolocalizando',
    	textVisible: true
    });

    navigator.geolocation.getCurrentPosition(success, error);
}

$(document).ready(init);

function init() {
  toastr.options = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": true,
    "positionClass": "toast-bottom-full-width",
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
        location.href = "#pHoy";
      } else {

        toastr.error("Usuario y/o contraseña incorrectos.");

      }
  });
  $("#btnMarcar").click(
    function() {
      geolocalizar();
    }
  )
}
