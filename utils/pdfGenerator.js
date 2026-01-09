const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

// Crear directorio de PDFs si no existe
const pdfsDir = path.join(__dirname, '..', 'uploads', 'cotizaciones');
if (!require('fs').existsSync(pdfsDir)) {
  require('fs').mkdirSync(pdfsDir, { recursive: true });
}

/**
 * Genera un PDF de cotización
 * @param {Object} cotizacion - Datos completos de la cotización
 * @returns {Promise<string>} - Ruta del archivo PDF generado
 */
const generarPDFCotizacion = async (cotizacion) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Nombre del archivo
      const nombreArchivo = `cotizacion-${cotizacion.numero_cotizacion}-${Date.now()}.pdf`;
      const rutaArchivo = path.join(pdfsDir, nombreArchivo);

      // Crear documento PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = require('fs').createWriteStream(rutaArchivo);
      doc.pipe(stream);

      // Colores
      const colorPrimary = '#9FC440'; // Verde FELMART
      const colorDark = '#1a1a1a';
      const colorGray = '#666666';

      // Header con Logo
      const logoPath = path.join(__dirname, '..', 'frontend', 'public', 'img', 'logo.png');
      try {
        if (require('fs').existsSync(logoPath)) {
          doc.image(logoPath, 50, 45, { width: 80 });
        }
      } catch (e) {
        console.warn('Logo no encontrado para PDF', e);
      }

      // Título alineado a la derecha si hay logo, o mantener izquierda si falla
      doc
        .fillColor(colorPrimary)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('FELMART', 150, 50)
        .fillColor(colorDark)
        .fontSize(16)
        .text('COTIZACIÓN', 150, 80);

      // Línea divisoria
      doc
        .strokeColor(colorPrimary)
        .lineWidth(2)
        .moveTo(50, 110)
        .lineTo(550, 110)
        .stroke();

      // Información de la cotización
      let yPos = 130;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(colorDark)
        .text(`Número de Cotización: ${cotizacion.numero_cotizacion}`, 50, yPos)
        .font('Helvetica')
        .fillColor(colorGray)
        .text(`Fecha: ${cotizacion.fecha_cotizacion ? new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : new Date().toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`, 50, yPos + 20)
        .text(`Estado: ${cotizacion.estado ? cotizacion.estado.charAt(0).toUpperCase() + cotizacion.estado.slice(1) : 'N/A'}`, 50, yPos + 40);

      yPos += 80;

      // Información del cliente
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(colorDark)
        .text('INFORMACIÓN DEL CLIENTE', 50, yPos);

      yPos += 25;
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor(colorDark);

      if (cotizacion.tipo_cotizacion === 'empresa' && cotizacion.empresa_nombre) {
        doc.text(`Empresa: ${cotizacion.empresa_nombre}`, 50, yPos);
        yPos += 18;
        if (cotizacion.empresa_rut) {
          doc.text(`RUT: ${cotizacion.empresa_rut}`, 50, yPos);
          yPos += 18;
        }
      }

      doc.text(`Cliente: ${cotizacion.usuario_nombre}`, 50, yPos);
      yPos += 18;

      if (cotizacion.empresa_direccion) {
        doc.text(`Dirección: ${cotizacion.empresa_direccion}`, 50, yPos);
        yPos += 18;
      }

      if (cotizacion.empresa_region && cotizacion.empresa_comuna) {
        doc.text(`Región: ${cotizacion.empresa_region}, ${cotizacion.empresa_comuna}`, 50, yPos);
        yPos += 18;
      }

      yPos += 20;

      // Tabla de residuos
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(colorDark)
        .text('DETALLE DE RESIDUOS', 50, yPos);

      yPos += 25;

      // Encabezados de tabla
      const tableTop = yPos;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(colorDark)
        .text('Descripción', 50, tableTop)
        .text('Cantidad', 300, tableTop)
        .text('Unidad', 370, tableTop)
        .text('Precio Unit.', 430, tableTop)
        .text('Subtotal', 500, tableTop);

      // Línea bajo encabezados
      yPos = tableTop + 15;
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(50, yPos)
        .lineTo(550, yPos)
        .stroke();

      yPos += 10;

      // Filas de residuos
      doc.fontSize(9).font('Helvetica').fillColor(colorDark);
      let totalGeneral = 0;

      if (!cotizacion.residuos || cotizacion.residuos.length === 0) {
        doc.text('No hay residuos registrados en esta cotización', 50, yPos);
        yPos += 20;
      } else {
        cotizacion.residuos.forEach((residuo) => {
        // Verificar si hay espacio en la página
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        const descripcion = residuo.residuo_descripcion || 'N/A';
        const cantidad = Number(residuo.cantidad) || 0;
        const unidad = residuo.unidad || 'N/A';
        const precioUnitario = Number(residuo.precio_unitario) || 0;
        const moneda = residuo.moneda_original || 'CLP';
        const subtotal = Math.round(Number(residuo.subtotal_clp) || 0);
        totalGeneral += subtotal;

        // Descripción (puede ser multilínea)
        const descripcionLines = doc.heightOfString(descripcion, { width: 240 });
        doc.text(descripcion, 50, yPos, { width: 240 });
        
        doc.text(cantidad.toString(), 300, yPos);
        doc.text(unidad, 370, yPos);
        
        // Formato precio unitario: si es UF, mostrar 2 decimales. Si es CLP, entero.
        const precioUnitarioStr = moneda === 'UF' ? precioUnitario.toFixed(2) : Math.round(precioUnitario).toLocaleString('es-CL');
        doc.text(`${precioUnitarioStr} ${moneda}`, 430, yPos);
        
        doc.text(`$${subtotal.toLocaleString('es-CL')}`, 500, yPos);

        yPos += Math.max(descripcionLines, 15) + 5;

        // Línea separadora
        doc
          .strokeColor('#eeeeee')
          .lineWidth(0.5)
          .moveTo(50, yPos - 2)
          .lineTo(550, yPos - 2)
          .stroke();
        });
      }

      yPos += 10;

      // Totales
      if (yPos > 650) { // Mayor margen inferior para evitar cortes
        doc.addPage();
        yPos = 50;
      }

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(colorDark)
        .text('RESUMEN', 50, yPos);

      yPos += 25; // Más espacio después del título

      const valorUF = Number(cotizacion.valor_uf) || 0;
      // Usar total_clp si existe (que ya incluye ajustes manuales), sino usar la suma calculada
      const totalNeto = (cotizacion.total_clp !== undefined && cotizacion.total_clp !== null) 
        ? Math.round(Number(cotizacion.total_clp)) 
        : Math.round(totalGeneral);
      
      const iva = Math.round(totalNeto * 0.19);
      const totalPagar = totalNeto + iva;

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(colorDark)
        .text(`Valor UF: $${valorUF.toLocaleString('es-CL')}`, 400, yPos);
        
      yPos += 20;
        
      doc
        .text(`Subtotal Neto: $${totalNeto.toLocaleString('es-CL')}`, 400, yPos);
        
      yPos += 20;
      
      doc
        .text(`IVA (19%): $${iva.toLocaleString('es-CL')}`, 400, yPos);
        
      yPos += 25; // Espacio extra antes del total final

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor(colorPrimary)
        .text(`TOTAL A PAGAR: $${totalPagar.toLocaleString('es-CL')} CLP`, 400, yPos);

      yPos += 60;

      // Observaciones
      if (cotizacion.observaciones) {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor(colorDark)
          .text('OBSERVACIONES', 50, yPos);

        yPos += 15;

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(colorGray)
          .text(cotizacion.observaciones, 50, yPos, { width: 500 });
      }

      // Footer
      const pageHeight = doc.page.height;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(colorGray)
        .text(
          'Este documento es una cotización generada por FELMART. Válido por 30 días desde su emisión.',
          50,
          pageHeight - 50,
          { width: 500, align: 'center' }
        );

      // Finalizar documento
      doc.end();

      stream.on('finish', () => {
        resolve(rutaArchivo);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generarPDFCotizacion
};

