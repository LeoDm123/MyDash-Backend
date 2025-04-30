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

  // Edad
  if (beca.requisitos && beca.requisitos.edadMax) {
    const edadUsuario = calcularEdad(usuario.personalData.birthDate);
    console.log(`📋 Edad máxima permitida: ${beca.requisitos.edadMax}`);

    if (edadUsuario > beca.requisitos.edadMax) {
      console.log("❌ No cumple edad máxima.");
      return false;
    }
  }

  // Nacionalidad
  if (beca.paisPostulante && Array.isArray(beca.paisPostulante)) {
    if (!beca.paisPostulante.includes(usuario.personalData.nationality)) {
      console.log("❌ Nacionalidad no permitida para esta beca.");
      return false;
    }
  }

  // Nivel académico
  if (beca.requisitos && beca.requisitos.nivelAcademicoMin) {
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

    console.log(
      `🎓 Nivel académico mínimo requerido: ${beca.requisitos.nivelAcademicoMin}`
    );
    console.log(`🎓 Nivel académico del usuario: ${nivelUsuario}`);

    if (
      niveles[nivelUsuario] > 0 &&
      beca.requisitos.nivelAcademicoMin === "Secundario"
    ) {
      console.log(
        "❌ Nivel académico mayor al requerido de Secundario (inconsistente)."
      );
      return false;
    }

    if (niveles[nivelUsuario] < niveles[beca.requisitos.nivelAcademicoMin]) {
      console.log("❌ Nivel académico insuficiente.");
      return false;
    }
  }

  // Idiomas requeridos
  if (beca.requisitos && beca.requisitos.idiomasRequeridos) {
    const cumpleIdiomas = beca.requisitos.idiomasRequeridos.every(
      (reqIdioma) => {
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
      }
    );

    if (!cumpleIdiomas) {
      console.log("❌ No cumple requisitos de idiomas.");
      return false;
    }
  }

  console.log("✅ Cumple todos los requisitos de la beca.");
  return true;
}

module.exports = {
  calcularEdad,
  usuarioTieneInformacionCompleta,
  obtenerNivelAcademicoMaximo,
  cumpleNivelIdioma,
  cumpleRequisitos,
};
