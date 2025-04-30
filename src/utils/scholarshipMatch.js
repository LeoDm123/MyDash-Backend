// Edad
function calcularEdad(birthDate) {
  if (!birthDate) {
    console.log("⚠️ No se proporcionó fecha de nacimiento.");
    return 0;
  }
  const hoy = new Date();
  const fechaNacimiento = new Date(birthDate);
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const mes = hoy.getMonth() - fechaNacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }

  console.log(`📅 Edad calculada: ${edad} años`);
  return edad;
}

// Validación general de perfil
function usuarioTieneInformacionCompleta(usuario, requiereIdioma = false) {
  console.log("🔎 Verificando información completa del usuario...");

  if (
    !usuario ||
    !usuario.personalData ||
    !usuario.personalData.birthDate ||
    !usuario.personalData.nationality ||
    !Array.isArray(usuario.academicData) ||
    usuario.academicData.length === 0
  ) {
    console.log(
      "⚠️ Usuario incompleto: falta información personal o académica básica."
    );
    return "Faltan Datos";
  }

  const academicoInvalido = usuario.academicData.some((item) => !item.degree);
  if (academicoInvalido) {
    console.log("⚠️ Usuario incompleto: falta título en datos académicos.");
    return "Faltan Datos";
  }

  if (requiereIdioma) {
    if (!Array.isArray(usuario.languages) || usuario.languages.length === 0) {
      console.log(
        "⚠️ Usuario incompleto: no hay idiomas cargados y la beca requiere idioma."
      );
      return "Faltan Datos";
    }

    const idiomaInvalido = usuario.languages.some(
      (idioma) => !idioma.language || !idioma.level
    );
    if (idiomaInvalido) {
      console.log("⚠️ Usuario incompleto: idioma cargado sin nombre o nivel.");
      return "Faltan Datos";
    }
  }

  console.log("✅ Usuario tiene toda la información necesaria.");
  return true;
}

// Nivel académico máximo completado
function obtenerNivelAcademicoMaximo(academicData) {
  const niveles = {
    Secundario: 0,
    Grado: 1,
    Posgrado: 2,
    Maestría: 3,
    Doctorado: 4,
    Posdoctorado: 5,
  };

  if (!academicData || academicData.length === 0) {
    console.log("⚠️ No hay datos académicos disponibles.");
    return null;
  }

  const añoActual = new Date().getFullYear();

  const titulosCompletados = academicData.filter(
    (item) => item.endYear && item.endYear < añoActual
  );

  if (titulosCompletados.length === 0) {
    console.log("⚠️ No hay títulos académicos completados.");
    return null;
  }

  const maxDegree = titulosCompletados.reduce((maxDegree, item, index) => {
    if (index === 0) {
      return item.degree;
    }
    return niveles[item.degree] > niveles[maxDegree] ? item.degree : maxDegree;
  }, titulosCompletados[0].degree);

  console.log(`🎓 Nivel académico máximo detectado: ${maxDegree}`);
  return maxDegree;
}

// Comparación de niveles de idioma
function cumpleNivelIdioma(nivelUsuario, nivelRequerido) {
  const niveles = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const indiceUsuario = niveles.indexOf(nivelUsuario.toUpperCase());
  const indiceRequerido = niveles.indexOf(nivelRequerido.toUpperCase());

  if (indiceUsuario === -1 || indiceRequerido === -1) {
    console.log("⚠️ Nivel de idioma desconocido (usuario o requerido).");
    return false;
  }

  const cumple = indiceUsuario >= indiceRequerido;
  console.log(
    `🗣️ Comparando nivel idioma: usuario=${nivelUsuario} vs requerido=${nivelRequerido} ➔ ${
      cumple ? "Cumple" : "No cumple"
    }`
  );
  return cumple;
}

// Validaciones específicas
function cumpleEdadMaxima(usuario, beca) {
  const edadMax = Number(beca.requisitos?.edadMax);
  const edadUsuario = calcularEdad(usuario.personalData.birthDate);

  console.log(
    `📋 Edad del usuario: ${edadUsuario} / Edad máxima permitida: ${edadMax}`
  );

  if (!isNaN(edadMax) && edadUsuario > edadMax) {
    console.log("❌ Edad del usuario supera el máximo permitido.");
    return false;
  }

  return true;
}

function cumpleNacionalidad(usuario, beca) {
  const nacionalidadUsuario = usuario.personalData.nationality?.toLowerCase();

  if (!nacionalidadUsuario) {
    console.log("⚠️ No se encontró nacionalidad en el perfil del usuario.");
    return false;
  }

  const paisesPermitidos = beca.paisPostulante;

  if (!Array.isArray(paisesPermitidos) || paisesPermitidos.length === 0) {
    console.log("✅ Beca sin restricción de país de postulante.");
    return true; // Si no hay restricción, se permite
  }

  const normalizados = paisesPermitidos.map((p) => p.toLowerCase());

  if (normalizados.includes("todos")) {
    console.log(
      "✅ Nacionalidad permitida (la beca aplica a todos los países)."
    );
    return true;
  }

  if (normalizados.includes(nacionalidadUsuario)) {
    console.log(
      `✅ Nacionalidad permitida: ${usuario.personalData.nationality}`
    );
    return true;
  }

  console.log(
    `❌ Nacionalidad no permitida: ${
      usuario.personalData.nationality
    } no está en ${JSON.stringify(paisesPermitidos)}`
  );
  return false;
}

function cumpleNivelAcademico(usuario, beca) {
  if (!beca.requisitos?.nivelAcademicoMin) return true;

  const nivelUsuario =
    obtenerNivelAcademicoMaximo(usuario.academicData) || "Secundario";

  const niveles = {
    Secundario: 0,
    Grado: 1,
    Posgrado: 2,
    Maestría: 3,
    Doctorado: 4,
    Posdoctorado: 5,
  };

  const minRequerido = beca.requisitos.nivelAcademicoMin;
  console.log(
    `🎓 Nivel académico del usuario: ${nivelUsuario} / Mínimo requerido: ${minRequerido}`
  );

  if (niveles[nivelUsuario] < niveles[minRequerido]) {
    console.log("❌ Nivel académico insuficiente.");
    return false;
  }

  return true;
}

function cumpleIdiomas(usuario, beca) {
  if (!beca.requisitos?.idiomasRequeridos) return true;

  const resultado = beca.requisitos.idiomasRequeridos.every((reqIdioma) => {
    const idiomaCumple = usuario.languages.some((idioma) => {
      const coincideIdioma =
        idioma.language.toLowerCase() === reqIdioma.idioma.toLowerCase();
      const cumpleNivel = cumpleNivelIdioma(
        idioma.level,
        reqIdioma.nivelIdioma
      );
      return coincideIdioma && cumpleNivel;
    });
    return idiomaCumple;
  });

  if (!resultado) {
    console.log("❌ No cumple requisitos de idiomas.");
  }

  return resultado;
}

// Función principal
function cumpleRequisitos(usuario, beca) {
  console.log(
    `🔍 Evaluando requisitos para la beca: ${beca.nombreBeca || "(sin nombre)"}`
  );

  const idiomasRequeridos = beca.requisitos?.idiomasRequeridos || [];
  const requiereIdioma = idiomasRequeridos.length > 0;

  const validacion = usuarioTieneInformacionCompleta(usuario, requiereIdioma);
  if (validacion !== true) {
    console.log("⚠️ Resultado validación de usuario: faltan datos.");
    return "Cargar perfil para determinar si cumplís con los requisitos";
  }

  const checks = [
    cumpleEdadMaxima(usuario, beca),
    cumpleNacionalidad(usuario, beca),
    cumpleNivelAcademico(usuario, beca),
    cumpleIdiomas(usuario, beca),
  ];

  const resultadoFinal = checks.every((v) => v === true);

  if (resultadoFinal) {
    console.log("✅ Cumple todos los requisitos de la beca.");
    return true;
  } else {
    console.log("❌ No cumple todos los requisitos de la beca.");
    return false;
  }
}

// Exportación
module.exports = {
  calcularEdad,
  usuarioTieneInformacionCompleta,
  obtenerNivelAcademicoMaximo,
  cumpleNivelIdioma,
  cumpleEdadMaxima,
  cumpleNacionalidad,
  cumpleNivelAcademico,
  cumpleIdiomas,
  cumpleRequisitos,
};
