const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxwMPwFiwRYYOj4_krH4xrWq3S1mGiYtlTecR5zYzJX2X21kWR8yn_SLpAmX-7ieizkUQ/exec";
async function guardarEnGoogleSheets(data) {
  try {
    const params = new URLSearchParams();
    params.append("nombre", data.nombre);
    params.append("email", data.email);
    params.append("numero", data.numero);
    params.append("acepta", data.acepta ? "Sí" : "No");
    params.append("residuos", data.residuos.map(r => r.material + ": " + r.kilos + "kg").join(" | "));
    params.append("valor", data.valor);
    params.append("terapias", data.terapias);
    params.append("mascaras", data.mascaras);
    params.append("cremas", data.cremas);
    params.append("arboles", data.arboles);
    params.append("energia", data.energia);
    params.append("aceite", data.aceite);
    params.append("espacio", data.espacio);
    params.append("agua", data.agua);

    await fetch(GOOGLE_SHEET_URL + "?" + params.toString(), {
      method: "GET",
      mode: "no-cors",
    });

    console.log("Datos guardados en Google Sheets ✓");
  } catch (err) {
    console.error("Error guardando en Sheets:", err);
  }
}

function init() {
  $(document).on("click", ".btn-agregar-fila-circle", function () {
    agregarFilaResiduo();
  });

  $(document).on("click", ".btn-eliminar-fila", function () {
    if ($(".fila-residuo").length === 1) {
      bootbox.alert("Debe quedar al menos una fila.");
      return;
    }

    $(this).closest(".fila-residuo").remove();
    actualizarBotonesFilas();
  });

  $("#btnAbrirModal").on("click", function () {
    if (!validarResiduosAntesModal()) {
      return;
    }

    $("#modalLead").modal("show");
  });

  $("#formLead").on("submit", function (e) {
    e.preventDefault();

    let btn = $("#btnEnviarLead");

    btn.prop("disabled", true);
    btn.find(".texto-btn").text("Enviando...");
    btn.find(".spinner-btn").show();

    guardarLeadYMostrarResultado().finally(function () {
      btn.prop("disabled", false);
      btn.find(".texto-btn").text("Calcular ayuda");
      btn.find(".spinner-btn").hide();
    });
  });

  $("#btnDescargarPDF").on("click", function () {
    descargarResultadoPDF();
  });

  actualizarBotonesFilas();
  cargarGlobales();
}

function agregarFilaResiduo() {
  let html = `
    <div class="fila-residuo">
      <div class="grupo">
        <label>Tipo de residuo</label>
        <select class="input-estilo material-item" name="material[]" required>
          <option value="">Seleccione</option>
          <option value="papel">Papel</option>
          <option value="carton">Cartón</option>
          <option value="pet">PET</option>
          <option value="chatarra">Chatarra</option>
        </select>
        <small class="texto-ayuda-input">&nbsp;</small>
      </div>

      <div class="grupo">
        <label>Peso</label>
        <input type="number" step="0.01" min="50" class="input-estilo kilos-item" name="kilos[]" placeholder="Mínimo 50kg" required>
        <small class="texto-ayuda-input">Mínimo 50kg</small>
      </div>

      <div class="zona-boton-fila"></div>
    </div>
  `;

  $("#contenedorResiduos").append(html);
  actualizarBotonesFilas();
}

function actualizarBotonesFilas() {
  let totalFilas = $(".fila-residuo").length;

  $(".fila-residuo").each(function (index) {
    let zonaBoton = $(this).find(".zona-boton-fila");

    if (index === totalFilas - 1) {
      zonaBoton.html(`
        <button type="button" class="btn-agregar-fila-circle">
          <i class="fa fa-plus"></i>
        </button>
      `);
    } else {
      zonaBoton.html(`
        <button type="button" class="btn btn-default btn-eliminar-fila">
          <i class="fa fa-trash"></i>
        </button>
      `);
    }
  });
}

function obtenerListaResiduos() {
  let lista = [];

  $(".fila-residuo").each(function () {
    let material = $(this).find(".material-item").val();
    let kilos = $(this).find(".kilos-item").val();

    lista.push({
      material: material,
      kilos: kilos,
    });
  });

  return lista;
}

function validarResiduosAntesModal() {
  let lista = obtenerListaResiduos();

  if (lista.length === 0) {
    bootbox.alert("Debes ingresar al menos un residuo.");
    return false;
  }

  for (let i = 0; i < lista.length; i++) {
    let item = lista[i];

    if (!item.material || item.material === "") {
      bootbox.alert("Selecciona el tipo de residuo en todas las filas.");
      return false;
    }

    if (!item.kilos || item.kilos === "") {
      bootbox.alert("Ingresa el peso del residuo en todas las filas.");
      return false;
    }

    if (parseFloat(item.kilos) < 50) {
      bootbox.alert("Cada residuo debe tener como mínimo 50 kg.");
      return false;
    }
  }

  return true;
}

function calcularImpactoUnitario(material, kilos) {
  let papel = 0,
    carton = 0,
    pet = 0,
    chatarra = 0;

  kilos = parseFloat(kilos || 0);

  if (material === "papel") papel = kilos;
  if (material === "carton") carton = kilos;
  if (material === "pet") pet = kilos;
  if (material === "chatarra") chatarra = kilos;

  let valor = papel * 0.3 + carton * 0.5 + pet * 1 + chatarra * 0.3;

  let arboles = (papel * 17) / 1000 + (carton * 17) / 1000;

  let energia =
    (papel * 4100) / 1000 +
    (carton * 390) / 1000 +
    (pet * 7200) / 1000 +
    (chatarra * 642) / 1000;

  let aceite =
    (papel * 380) / 1000 +
    (carton * 46) / 1000 +
    (pet * 684.6) / 1000 +
    (chatarra * 75.6) / 1000;

  let espacio =
    (papel * 2.3) / 1000 +
    (carton * 6.880995) / 1000 +
    (pet * 22) / 1000 +
    (chatarra * 3.06) / 1000;

  let agua =
    (papel * 7000) / 1000 + (pet * 6000) / 1000 + (chatarra * 51958) / 1000;

  return {
    valor: valor,
    arboles: arboles,
    energia: energia,
    aceite: aceite,
    espacio: espacio,
    agua: agua,
  };
}

function calcularImpactoMultiple(lista) {
  let total = {
    valor: 0,
    terapias: 0,
    mascaras: 0,
    cremas: 0,
    arboles: 0,
    energia: 0,
    aceite: 0,
    espacio: 0,
    agua: 0,
  };

  let totalPapel = 0;
  let totalCarton = 0;

  lista.forEach(function (item) {
    let material = item.material;
    let kilos = parseFloat(item.kilos || 0);

    let r = calcularImpactoUnitario(material, kilos);

    total.valor += r.valor;
    total.energia += r.energia;
    total.aceite += r.aceite;
    total.espacio += r.espacio;
    total.agua += r.agua;

    if (material === "papel") totalPapel += kilos;
    if (material === "carton") totalCarton += kilos;
  });

  total.arboles = Math.floor(
    (totalPapel * 17) / 1000 + (totalCarton * 17) / 1000,
  );

  total.terapias = Math.floor(total.valor / 523);
  total.mascaras = Math.floor((total.valor - total.terapias * 523) / 125);
  total.cremas = Math.floor(
    (total.valor - total.terapias * 523 - total.mascaras * 125) / 20,
  );

  total.valor = total.valor.toFixed(2);
  total.energia = total.energia.toFixed(2);
  total.aceite = total.aceite.toFixed(2);
  total.espacio = total.espacio.toFixed(2);
  total.agua = total.agua.toFixed(2);

  return total;
}

async function guardarLeadYMostrarResultado() {
  let lista = obtenerListaResiduos();

  let nombre = $("#nombre").val().trim();
  let email = $("#email").val().trim();
  let numero = $("#numero").val().trim();

  // let imagen =
  //   "https://tse2.mm.bing.net/th/id/OIP.Kn7YtulzjN7dO9hLM3_aBgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3";

  if (!validarResiduosAntesModal()) {
    return $.Deferred().reject().promise();
  }

  if (nombre === "" || email === "" || numero === "") {
    bootbox.alert("Completa nombre, email y número.");
    return $.Deferred().reject().promise();
  }

  let r = calcularImpactoMultiple(lista);
// Guardar en Google Sheets
await guardarEnGoogleSheets({
  nombre: nombre,
  email: email,
  numero: numero,
  acepta: $("#acepta").is(":checked"),
  residuos: lista,
  valor: r.valor,
  terapias: r.terapias,
  mascaras: r.mascaras,
  cremas: r.cremas,
  arboles: r.arboles,
  energia: r.energia,
  aceite: r.aceite,
  espacio: r.espacio,
  agua: r.agua
});

  // Mostrar primero el resultado para poder capturarlo bien
  mostrarResultados(r);

  let imagenBase64 = "";
  try {
    imagenBase64 = await capturarResultadoComoBase64();
  } catch (e) {
    console.error("No se pudo capturar la imagen del resultado:", e);
  }

  let formData = new FormData();
  formData.append("nombre", nombre);
  formData.append("email", email);
  formData.append("numero", numero);
  formData.append("acepta", $("#acepta").is(":checked") ? 1 : 0);

  formData.append("valor", r.valor);
  formData.append("terapias", r.terapias);
  formData.append("mascaras", r.mascaras);
  formData.append("cremas", r.cremas);
  formData.append("arboles", r.arboles);
  formData.append("energia", r.energia);
  formData.append("aceite", r.aceite);
  formData.append("espacio", r.espacio);
  formData.append("agua", r.agua);
  formData.append("imagen_resultado", imagenBase64);

  lista.forEach(function (item) {
    formData.append("material[]", item.material);
    formData.append("kilos[]", item.kilos);
  });

  let urlImagen = await subirImagenACloudinary(imagenBase64);
  if (!urlImagen) {
    bootbox.alert("No se pudo subir la imagen. El correo no se enviará.");
    return;
  }

  await enviarCorreoEmailJS({
    nombre: nombre,
    numero: numero,
    email: email,
    imagen: urlImagen,
  });

  //
  return limpiarTodo();
  // cargarGlobales();
  //

  // return $.ajax({
  //   url: "../ajax/calculadora.php?op=guardar",
  //   type: "POST",
  //   data: formData,
  //   contentType: false,
  //   processData: false,
  //   success: function (resp) {
  //     resp = $.trim(resp);

  //     if (resp === "ok") {
  //       $("#modalLead").modal("hide");
  //       cargarGlobales();
  //       limpiarTodo();
  //     } else if (resp === "error_datos") {
  //       bootbox.alert("Faltan datos del formulario.");
  //     } else if (resp === "error_email") {
  //       bootbox.alert("El correo no tiene un formato válido.");
  //     } else if (resp === "error_residuos") {
  //       bootbox.alert("Los residuos enviados no son válidos.");
  //     } else if (resp === "error_material") {
  //       bootbox.alert("Se detectó un material no permitido.");
  //     } else if (resp === "error_kilos") {
  //       bootbox.alert("Cada residuo debe tener como mínimo 50 kg.");
  //     } else {
  //       bootbox.alert("No se pudo guardar la información.");
  //       console.log("RESPUESTA:", resp);
  //       console.log(resp);
  //     }
  //   },
  //   error: function (xhr) {
  //     console.log(xhr.responseText);
  //     bootbox.alert("Error en la petición AJAX.");
  //   },
  // });
}

// async function subirImagenCloudinary(file) {
//   const url = `https://api.cloudinary.com/v1_1/dytaazqjb/image/upload`;
//   const formData = new FormData();
//   formData.append("file", file); // Blob o File
//   formData.append("upload_preset", "ml_default");

//   const res = await fetch(url, {
//     method: "POST",
//     body: formData,
//   });

//   if (!res.ok) throw new Error("Error subiendo a Cloudinary");

//   const data = await res.json();
//   return data.secure_url; // <-- esta es la URL que puedes usar en tu EmailJS
// }

async function subirImagenACloudinary(imagenBase64) {
  const formData = new FormData();
  formData.append("file", imagenBase64); // Base64 de la imagen
  formData.append("upload_preset", "ml_default"); // tu preset unsigned

  try {
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dytaazqjb/image/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();
    console.log("URL pública:", data.secure_url); // esta es la URL que usarías en el email
    return data.secure_url;
  } catch (err) {
    console.error("Error subiendo la imagen a Cloudinary:", err);
    return null;
  }
}

function mostrarResultados(r) {
  $("#r_arboles").text(r.arboles);
  $("#r_espacio").text(r.espacio);
  $("#r_agua").text(r.agua);
  $("#r_energia").text(r.energia);

  $("#r_terapias").text(r.terapias);
  $("#r_mascaras").text(r.mascaras);
  $("#r_cremas").text(r.cremas);

  $("#resultadoBloque").show();

  $("html, body").animate(
    {
      scrollTop: $("#resultadoBloque").offset().top - 40,
    },
    500,
  );
}

async function enviarCorreoEmailJS(data) {
  // Prepara los parámetros para EmailJS
  const payload = {
    service_id: "service_aniquem", // reemplaza con tu Service ID
    template_id: "template_gyw0pam", // reemplaza con tu Template ID
    user_id: "upSGiI757sMSdgKjd", // reemplaza con tu Public Key
    template_params: {
      nombre: data.nombre,
      numero: data.numero,
      email: data.email,
      to_email: data.email,
      imagen_url: data.imagen,
    },
  };

  try {
    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(
        "Error enviando correo: " + response.status + " " + response.statusText,
      );
    }

    console.log("Correo enviado correctamente!");
  } catch (err) {
    console.error("Error enviando correo:", err);
  }
}

// Ejemplo de uso
// let imagenBase64 = await capturarResultadoComoBase64();
// enviarCorreoSoloImagen(imagenBase64);

// function cargarGlobales() {
//   $.get("../ajax/calculadora.php?op=globales", function (resp) {
//     try {
//       let data = JSON.parse(resp);
//       $("#g_registros").text(data.registros || 0);
//     } catch (e) {
//       console.log(resp);
//     }
//   });
// }

function limpiarTodo() {
  $("#formLead")[0].reset();
  $("#modalLead").modal("hide");

  $("#contenedorResiduos").html(`
    <div class="fila-residuo">
      <div class="grupo">
        <label>Tipo de residuo</label>
        <select class="input-estilo material-item" name="material[]" required>
          <option value="">Seleccione</option>
          <option value="papel">Papel</option>
          <option value="carton">Cartón</option>
          <option value="pet">PET</option>
          <option value="chatarra">Chatarra</option>
        </select>
        <small class="texto-ayuda-input">&nbsp;</small>
      </div>

      <div class="grupo">
        <label>Peso</label>
        <input type="number" step="0.01" min="50" class="input-estilo kilos-item" name="kilos[]" placeholder="Mínimo 50kg" required>
        <small class="texto-ayuda-input">Mínimo 50kg</small>
      </div>

      <div class="zona-boton-fila">
        <button type="button" class="btn-agregar-fila-circle">
          <i class="fa fa-plus"></i>
        </button>
      </div>
    </div>
  `);

  actualizarBotonesFilas();
}

async function descargarResultadoPDF() {
  if (
    typeof html2canvas === "undefined" ||
    typeof window.jspdf === "undefined"
  ) {
    bootbox.alert("Faltan las librerías para generar el PDF.");
    return;
  }

  const bloque = document.getElementById("resultadoBloque");

  if (!bloque || $(bloque).is(":hidden")) {
    bootbox.alert("Primero debes calcular un resultado.");
    return;
  }

  // Clonar Elemento
  const clone = bloque.cloneNode(true);

  clone.style.width = "1200px";
  clone.style.maxWidth = "1200px";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.display = "block";

  document.body.appendChild(clone);

  try {
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      scrollX: 0,
      scrollY: -window.scrollY,
    });

    document.body.removeChild(clone);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 8;

    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= usableHeight) {
      const y = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
    } else {
      let finalWidth = usableWidth;
      let finalHeight = imgHeight;
      if (finalHeight > usableHeight) {
        finalHeight = usableHeight;
        finalWidth = (canvas.width * finalHeight) / canvas.height;
      }
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
    }

    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const hh = String(fecha.getHours()).padStart(2, "0");
    const mi = String(fecha.getMinutes()).padStart(2, "0");
    pdf.save(`resultado_aniquem_${yyyy}${mm}${dd}_${hh}${mi}.pdf`);
  } catch (error) {
    document.body.removeChild(clone);

    console.error(error);
    bootbox.alert("No se pudo generar el PDF.");
  }
}

async function capturarResultadoComoBase64() {
  const bloque = document.getElementById("resultadoBloque");

  const clone = bloque.cloneNode(true);

  clone.style.width = "1200px";
  clone.style.maxWidth = "1200px";
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.display = "block";

  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    scale: 1.0,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: 1200,
    scrollX: 0,
    scrollY: -window.scrollY,
  });

  document.body.removeChild(clone);

  return canvas.toDataURL("image/png", 0.6);
}

const telefonoInput = document.getElementById("numero");

telefonoInput.addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "").slice(0, 9);

  let formatted = value.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");

  e.target.value = value.length > 6 ? formatted : value;
});

function validarTelefono(numero) {
  return /^9\d{8}$/.test(numero);
}


init();
