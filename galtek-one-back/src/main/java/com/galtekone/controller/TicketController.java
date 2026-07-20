package com.galtekone.controller;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.RenderingHints;
import java.awt.Stroke;
import java.awt.BasicStroke;
import java.awt.image.BufferedImage;
import java.awt.print.PageFormat;
import java.awt.print.Paper;
import java.awt.print.Printable;
import java.awt.print.PrinterException;
import java.awt.print.PrinterJob;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.imageio.ImageIO;
import javax.print.Doc;
import javax.print.DocFlavor;
import javax.print.DocPrintJob;
import javax.print.PrintException;
import javax.print.PrintService;
import javax.print.PrintServiceLookup;
import javax.print.SimpleDoc;
import javax.print.attribute.HashPrintRequestAttributeSet;
import javax.print.attribute.PrintRequestAttributeSet;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.galtekone.dto.ticket.TicketConfigDTO;
import com.galtekone.dto.ticket.TicketPrintRequest;
import com.galtekone.services.ConfiguracionTicketService;
import com.galtekone.utils.ApiResponseBuilder;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(path = "ticket")
@RequiredArgsConstructor
public class TicketController {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final DateTimeFormatter PRINT_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm", new Locale("es", "MX"));
    private static final int WIDTH_58 = 32;
    private static final int WIDTH_80 = 42;
    private static final int PIXELS_58 = 384;
    private static final int PIXELS_80 = 576;
    private static final int MAX_RENDER_HEIGHT = 9000;

    private final ConfiguracionTicketService configuracionTicketService;

    @GetMapping(value = "/impresoras", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> listarImpresoras(
            @RequestHeader(name = "user", required = true) String user
    ) {
        long startTime = System.currentTimeMillis();

        try {
            PrintService defaultService = PrintServiceLookup.lookupDefaultPrintService();
            PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);
            List<Map<String, Object>> printers = new ArrayList<>();

            for (PrintService service : services) {
                Map<String, Object> printer = new HashMap<>();
                printer.put("name", service.getName());
                printer.put(
                        "defaultPrinter",
                        defaultService != null && service.getName().equals(defaultService.getName())
                );
                printer.put("textOnly", prefersRawText(service));
                printer.put("rawTextSupported", supportsRawText(service));
                printers.add(printer);
            }

            Map<String, Object> resp = new HashMap<>();
            resp.put("defaultPrinter", defaultService == null ? "" : defaultService.getName());
            resp.put("printers", printers);

            return ApiResponseBuilder.buildSuccessResponse(
                    resp,
                    user,
                    startTime,
                    "Impresoras obtenidas correctamente"
            );
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user,
                    startTime,
                    "Error al obtener impresoras: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @PostMapping(
            value = "/imprimir",
            produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Object> imprimirTicket(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody TicketPrintRequest request
    ) {
        long startTime = System.currentTimeMillis();

        try {
            if (request == null) {
                return ApiResponseBuilder.buildErrorResponse(
                        user,
                        startTime,
                        "El ticket no puede estar vacio",
                        HttpStatus.BAD_REQUEST
                );
            }

            if (request.getItems() == null || request.getItems().isEmpty()) {
                return ApiResponseBuilder.buildErrorResponse(
                        user,
                        startTime,
                        "El ticket debe tener al menos un producto",
                        HttpStatus.BAD_REQUEST
                );
            }

            TicketConfigDTO config = configuracionTicketService.readActual();
            String printerName = firstNonBlank(request.getPrinterName(), config.getDefaultPrinterName());
            PrintService printer = resolvePrinter(printerName);
            String printEngine = printTicket(printer, request, config);

            Map<String, Object> resp = new HashMap<>();
            resp.put("folio", request.getFolio());
            resp.put("items", request.getItems().size());
            resp.put("printerName", printer.getName());
            resp.put("printEngine", printEngine);
            resp.put("impreso", true);
            resp.put("mensaje", "Ticket enviado a " + printer.getName());

            return ApiResponseBuilder.buildSuccessResponse(
                    resp,
                    user,
                    startTime,
                    "Ticket impreso correctamente"
            );
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (PrintException e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user,
                    startTime,
                    "Error al imprimir ticket: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user,
                    startTime,
                    "Error al procesar el ticket: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private PrintService resolvePrinter(String requestedName) {
        PrintService[] services = PrintServiceLookup.lookupPrintServices(null, null);
        String target = safe(requestedName);

        if (!target.isEmpty()) {
            for (PrintService service : services) {
                if (service.getName().equalsIgnoreCase(target)) {
                    return service;
                }
            }
            for (PrintService service : services) {
                String serviceName = service.getName().toLowerCase(Locale.ROOT);
                String requested = target.toLowerCase(Locale.ROOT);
                if (serviceName.contains(requested) || requested.contains(serviceName)) {
                    return service;
                }
            }
            throw new IllegalArgumentException("No se encontro la impresora: " + target);
        }

        PrintService defaultService = PrintServiceLookup.lookupDefaultPrintService();
        if (defaultService != null) {
            return defaultService;
        }
        if (services.length == 1) {
            return services[0];
        }
        if (services.length == 0) {
            throw new IllegalArgumentException("No hay impresoras instaladas o visibles para Java.");
        }
        throw new IllegalArgumentException("Selecciona una impresora; no hay predeterminada configurada.");
    }

    private String printTicket(PrintService printer, TicketPrintRequest request, TicketConfigDTO config) throws PrintException {
        if (prefersRawText(printer)) {
            try {
                printEscPosRaster(printer, request, config);
                return "ESC_POS_RASTER";
            } catch (PrintException ex) {
                throw new PrintException("No se pudo enviar el ticket como imagen ESC/POS: " + ex.getMessage());
            }
        }

        String text = buildTicketText(request, config);
        try {
            printGraphics(printer, text, config);
            return "JAVA2D";
        } catch (PrintException ex) {
            printRawText(printer, text);
            return "RAW_TEXT_FALLBACK";
        }
    }

    private boolean prefersRawText(PrintService printer) {
        String name = printer == null ? "" : printer.getName().toLowerCase(Locale.ROOT);
        return name.contains("generic")
                || name.contains("text only")
                || name.contains("texto")
                || name.contains("esc/pos");
    }

    private boolean supportsRawText(PrintService printer) {
        if (printer == null) {
            return false;
        }
        return printer.isDocFlavorSupported(DocFlavor.BYTE_ARRAY.TEXT_PLAIN_HOST)
                || printer.isDocFlavorSupported(DocFlavor.BYTE_ARRAY.TEXT_PLAIN_US_ASCII)
                || printer.isDocFlavorSupported(DocFlavor.BYTE_ARRAY.AUTOSENSE)
                || printer.isDocFlavorSupported(DocFlavor.BYTE_ARRAY.TEXT_PLAIN_UTF_8)
                || printer.isDocFlavorSupported(DocFlavor.STRING.TEXT_PLAIN);
    }

    private void printEscPosRaster(PrintService printer, TicketPrintRequest request, TicketConfigDTO config)
            throws PrintException {
        BufferedImage image = renderTicketImage(request, config);
        byte[] command = buildEscPosRaster(image);
        printDoc(printer, new SimpleDoc(command, DocFlavor.BYTE_ARRAY.AUTOSENSE, null));
    }

    private byte[] buildEscPosRaster(BufferedImage image) throws PrintException {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            out.write(0x1B);
            out.write('@');

            // ESC * imprime bandas de 24 puntos. Es mas tolerante que GS v 0 en
            // drivers Generic/Text porque no manda bloques raster enormes.
            out.write(0x1B);
            out.write('3');
            out.write(24);

            int width = image.getWidth();
            int widthLow = width & 0xFF;
            int widthHigh = (width >> 8) & 0xFF;
            for (int y = 0; y < image.getHeight(); y += 24) {
                out.write(0x1B);
                out.write('*');
                out.write(33);
                out.write(widthLow);
                out.write(widthHigh);
                out.write(packBitImageBand(image, y));
                out.write('\n');
            }

            out.write(0x1B);
            out.write('2');
            out.write('\n');
            out.write('\n');
            out.write('\n');
            out.write(0x1B);
            out.write('@');
            return out.toByteArray();
        } catch (Exception ex) {
            throw new PrintException(ex);
        }
    }

    private byte[] packBitImageBand(BufferedImage image, int startY) {
        byte[] data = new byte[image.getWidth() * 3];
        int index = 0;
        for (int x = 0; x < image.getWidth(); x++) {
            for (int slice = 0; slice < 3; slice++) {
                int value = 0;
                for (int bit = 0; bit < 8; bit++) {
                    int y = startY + slice * 8 + bit;
                    if (y < image.getHeight() && isBlack(image.getRGB(x, y))) {
                        value |= 0x80 >> bit;
                    }
                }
                data[index++] = (byte) value;
            }
        }
        return data;
    }

    private boolean isBlack(int rgb) {
        int red = (rgb >> 16) & 0xFF;
        int green = (rgb >> 8) & 0xFF;
        int blue = rgb & 0xFF;
        int luminance = (red * 30 + green * 59 + blue * 11) / 100;
        return luminance < 186;
    }

    private void printRawText(PrintService printer, String text) throws PrintException {
        String printableText = String.join("\r\n", printableLines(text)) + "\r\n\r\n\r\n\f";
        DocFlavor[] byteFlavors = new DocFlavor[]{
                DocFlavor.BYTE_ARRAY.TEXT_PLAIN_HOST,
                DocFlavor.BYTE_ARRAY.TEXT_PLAIN_US_ASCII,
                DocFlavor.BYTE_ARRAY.AUTOSENSE,
                DocFlavor.BYTE_ARRAY.TEXT_PLAIN_UTF_8
        };

        for (DocFlavor flavor : byteFlavors) {
            if (printer.isDocFlavorSupported(flavor)) {
                printDoc(printer, new SimpleDoc(bytesForFlavor(printableText, flavor), flavor, null));
                return;
            }
        }

        if (printer.isDocFlavorSupported(DocFlavor.STRING.TEXT_PLAIN)) {
            printDoc(printer, new SimpleDoc(printableText, DocFlavor.STRING.TEXT_PLAIN, null));
            return;
        }

        printDoc(
                printer,
                new SimpleDoc(printableText.getBytes(StandardCharsets.US_ASCII), DocFlavor.BYTE_ARRAY.AUTOSENSE, null)
        );
    }

    private void printDoc(PrintService printer, Doc doc) throws PrintException {
        DocPrintJob job = printer.createPrintJob();
        job.print(doc, new HashPrintRequestAttributeSet());
    }

    private byte[] bytesForFlavor(String text, DocFlavor flavor) {
        if (DocFlavor.BYTE_ARRAY.TEXT_PLAIN_UTF_8.equals(flavor)) {
            return text.getBytes(StandardCharsets.UTF_8);
        }
        if (DocFlavor.BYTE_ARRAY.TEXT_PLAIN_HOST.equals(flavor)) {
            return text.getBytes(Charset.defaultCharset());
        }
        return text.getBytes(StandardCharsets.US_ASCII);
    }

    private void printGraphics(PrintService printer, String text, TicketConfigDTO config) throws PrintException {
        try {
            List<String> lines = printableLines(text);
            double paperWidth = mmToPoints("80".equals(config.getPaperSize()) ? 80 : 58);
            double margin = mmToPoints("80".equals(config.getPaperSize()) ? 4 : 2.5);
            Font font = new Font(resolvePrintFont(config.getFontFamily()), Font.PLAIN, resolvePrintFontSize(config));
            double lineHeight = Math.max(8.5, font.getSize2D() + 3.0);
            double paperHeight = Math.max(mmToPoints(120), margin * 2 + lines.size() * lineHeight + mmToPoints(8));

            Paper paper = new Paper();
            paper.setSize(paperWidth, paperHeight);
            paper.setImageableArea(margin, margin, paperWidth - margin * 2, paperHeight - margin * 2);

            PageFormat pageFormat = new PageFormat();
            pageFormat.setOrientation(PageFormat.PORTRAIT);
            pageFormat.setPaper(paper);

            PrinterJob job = PrinterJob.getPrinterJob();
            job.setPrintService(printer);
            job.setPrintable(new TicketPrintable(lines, font, lineHeight), pageFormat);

            PrintRequestAttributeSet attributes = new HashPrintRequestAttributeSet();
            job.print(attributes);
        } catch (PrinterException ex) {
            throw new PrintException(ex);
        }
    }

    private BufferedImage renderTicketImage(TicketPrintRequest request, TicketConfigDTO config) throws PrintException {
        try {
            int width = "80".equals(config.getPaperSize()) ? PIXELS_80 : PIXELS_58;
            int margin = renderMargin(config);
            BufferedImage canvas = new BufferedImage(width, MAX_RENDER_HEIGHT, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = canvas.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, width, MAX_RENDER_HEIGHT);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

            RenderState state = new RenderState(g, config, width, margin);
            int y = margin + 4;
            JsonNode blocks = readBlocks(config.getTemplateJson());

            for (JsonNode block : blocks) {
                if (!block.path("visible").asBoolean(true)) {
                    continue;
                }
                JsonNode settings = block.path("settings");
                y = renderBlockImage(state, request, block, y);
                if (settings.path("separatorAfter").asBoolean(true)) {
                    y = drawImageSeparator(state, y);
                }
                y += densityBlockGap(config);
                if (y > MAX_RENDER_HEIGHT - 320) {
                    break;
                }
            }

            int finalHeight = Math.max(120, Math.min(MAX_RENDER_HEIGHT, y + margin + 18));
            BufferedImage cropped = new BufferedImage(width, finalHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D out = cropped.createGraphics();
            out.setColor(Color.WHITE);
            out.fillRect(0, 0, width, finalHeight);
            out.drawImage(canvas, 0, 0, width, finalHeight, 0, 0, width, finalHeight, null);
            out.dispose();
            g.dispose();
            return cropped;
        } catch (Exception ex) {
            throw new PrintException(ex);
        }
    }

    private int renderBlockImage(RenderState state, TicketPrintRequest request, JsonNode block, int y) {
        String type = block.path("type").asText("");
        JsonNode settings = block.path("settings");
        return switch (type) {
            case "LOGO" -> renderLogoBlock(state, settings, y);
            case "STORE_HEADER" -> renderStoreHeaderBlock(state, settings, y);
            case "SALE_INFO" -> renderSaleInfoBlock(state, request, settings, y);
            case "CUSTOMER" -> renderCustomerBlock(state, request, settings, y);
            case "PRODUCTS" -> renderProductsBlock(state, request, settings, y);
            case "TOTALS" -> renderTotalsBlock(state, request, settings, y);
            case "PAYMENT" -> renderPaymentBlock(state, request, settings, y);
            case "CASHIER" -> renderCashierBlock(state, request, settings, y);
            case "FOOTER_MESSAGE" -> drawWrapped(
                    state,
                    firstNonBlank(state.config.getFooterMessage(), storeText(state.config, "ticketMensaje"), "Gracias por su compra"),
                    settings.path("align").asText(state.config.getAlignment()),
                    fontForBlock(state.config, settings, blockStyle(settings), 1.0f),
                    settings.path("underline").asBoolean(false),
                    y
            );
            case "FOLIO_CODE" -> renderCodeBlock(state, request, settings, y);
            case "CUSTOM_TEXT" -> drawWrapped(
                    state,
                    settings.path("text").asText(""),
                    settings.path("align").asText(state.config.getAlignment()),
                    fontForBlock(state.config, settings, blockStyle(settings), 1.0f),
                    false,
                    y
            );
            default -> y;
        };
    }

    private int renderLogoBlock(RenderState state, JsonNode settings, int y) {
        BufferedImage logo = decodeLogo(state.config);
        String align = settings.path("align").asText("CENTRO");
        if (logo == null) {
            return drawWrapped(
                    state,
                    "Galtek One",
                    align,
                    new Font(resolveRenderFont("ARIAL"), Font.BOLD, renderBaseFontSize(state.config) + 8),
                    false,
                    y
            );
        }

        int targetWidth = logoTargetWidth(settings.path("logoSize").asText("MEDIANO"), state.contentWidth);
        int targetHeight = Math.max(1, Math.round((float) logo.getHeight() * targetWidth / Math.max(1, logo.getWidth())));
        int maxHeight = Math.max(54, state.contentWidth / 3);
        if (targetHeight > maxHeight) {
            targetHeight = maxHeight;
            targetWidth = Math.max(1, Math.round((float) logo.getWidth() * targetHeight / Math.max(1, logo.getHeight())));
        }

        int x = alignedX(state, targetWidth, align);
        Image scaled = logo.getScaledInstance(targetWidth, targetHeight, Image.SCALE_SMOOTH);
        state.g.drawImage(scaled, x, y, targetWidth, targetHeight, null);
        return y + targetHeight + lineSpacingExtra(state.config) + 4;
    }

    private int renderStoreHeaderBlock(RenderState state, JsonNode settings, int y) {
        String align = settings.path("align").asText("CENTRO");
        if (settings.path("showStoreName").asBoolean(true)) {
            y = drawWrapped(
                    state,
                    styled(storeText(state.config, "nombre"), settings, "name"),
                    align,
                    fontForPart(state.config, settings, "name", Font.BOLD, 1.08f),
                    settings.path("nameUnderline").asBoolean(false),
                    y
            );
        }
        if (settings.path("showFiscal").asBoolean(true)) {
            y = drawWrappedIfPresent(
                    state,
                    styled(storeText(state.config, "razonSocial"), settings, "fiscal"),
                    align,
                    fontForPart(state.config, settings, "fiscal", Font.PLAIN, 0.9f),
                    settings.path("fiscalUnderline").asBoolean(false),
                    y
            );
            y = drawWrappedIfPresent(
                    state,
                    styled(prefix("RFC ", storeText(state.config, "rfc")), settings, "fiscal"),
                    align,
                    fontForPart(state.config, settings, "fiscal", Font.PLAIN, 0.88f),
                    settings.path("fiscalUnderline").asBoolean(false),
                    y
            );
        }
        if (settings.path("showAddress").asBoolean(false)) {
            y = drawWrappedIfPresent(
                    state,
                    styled(buildAddress(state.config), settings, "address"),
                    align,
                    fontForPart(state.config, settings, "address", Font.PLAIN, 0.86f),
                    settings.path("addressUnderline").asBoolean(false),
                    y
            );
        }
        if (settings.path("showContact").asBoolean(false)) {
            List<String> parts = contactParts(state.config, settings);
            if ("SALTO".equals(settings.path("contactLayout").asText("LINEA"))) {
                for (String part : parts) {
                    y = drawWrappedIfPresent(
                            state,
                            styled(part, settings, "contact"),
                            align,
                            fontForPart(state.config, settings, "contact", Font.PLAIN, 0.82f),
                            settings.path("contactUnderline").asBoolean(false),
                            y
                    );
                }
            } else {
                y = drawWrappedIfPresent(
                        state,
                        styled(String.join(" | ", parts), settings, "contact"),
                        align,
                        fontForPart(state.config, settings, "contact", Font.PLAIN, 0.82f),
                        settings.path("contactUnderline").asBoolean(false),
                        y
                );
            }
        }
        return y;
    }

    private int renderSaleInfoBlock(RenderState state, TicketPrintRequest request, JsonNode settings, int y) {
        y = drawImagePair(state, "Folio", safe(request.getFolio()), settings, y);
        return drawImagePair(state, "Fecha", firstNonBlank(request.getFecha(), LocalDateTime.now().format(PRINT_DATE_FORMAT)), settings, y);
    }

    private int renderCashierBlock(RenderState state, TicketPrintRequest request, JsonNode settings, int y) {
        y = drawImagePair(state, "Caja", firstNonBlank(request.getCaja(), "Caja principal"), settings, y);
        return drawImagePair(state, "Cajero", firstNonBlank(request.getCajero(), "Caja"), settings, y);
    }

    private int renderCustomerBlock(RenderState state, TicketPrintRequest request, JsonNode settings, int y) {
        y = drawImagePair(state, "Cliente", firstNonBlank(request.getClienteNombre(), "Publico general"), settings, y);
        return drawImagePairIfPresent(state, "Telefono", request.getClienteTelefono(), settings, y);
    }

    private int renderProductsBlock(RenderState state, TicketPrintRequest request, JsonNode settings, int y) {
        Font normal = fontForBlock(state.config, settings, Font.PLAIN, 0.98f);
        Font small = fontForBlock(state.config, settings, Font.PLAIN, 0.72f);
        y = drawImagePair(state, "Producto", "Imp.", settings, y, normal, normal, false, false);
        for (TicketPrintRequest.Item item : request.getItems()) {
            BigDecimal total = item.getTotal() == null
                    ? number(item.getPrecioUnitario()).multiply(number(item.getCantidad()))
                    : item.getTotal();
            y = drawImagePair(state, safe(item.getNombre()), money(total), settings, y, normal, normal, false, true);
            if (settings.path("showItemDetail").asBoolean(true)) {
                y = drawWrapped(
                        state,
                        formatQuantity(item.getCantidad()) + " x " + money(item.getPrecioUnitario()),
                        "IZQUIERDA",
                        small,
                        false,
                        y
                );
            }
        }
        return y;
    }

    private int renderTotalsBlock(RenderState state, TicketPrintRequest request, JsonNode settings, int y) {
        BigDecimal subtotal = request.getSubtotal() == null ? sumItems(request) : request.getSubtotal();
        BigDecimal discount = number(request.getDescuento());
        BigDecimal tax = number(request.getImpuesto());
        y = drawImagePair(state, "Subtotal", money(subtotal), settings, y);
        if (discount.compareTo(BigDecimal.ZERO) != 0) {
            y = drawImagePair(state, "Descuento", "-" + money(discount.abs()), settings, y);
        }
        if (tax.compareTo(BigDecimal.ZERO) != 0) {
            y = drawImagePair(state, "Impuesto", money(tax), settings, y);
        }
        Font bold = fontForBlock(state.config, settings, Font.BOLD, settings.path("highlightTotal").asBoolean(true) ? 1.08f : 1.0f);
        return drawImagePair(state, "Total", money(request.getTotal()), settings, y, bold, bold, false, false);
    }

    private int renderPaymentBlock(RenderState state, TicketPrintRequest request, JsonNode settings, int y) {
        y = drawImagePair(state, "Pago", titleCase(firstNonBlank(request.getMetodoPago(), "Efectivo")), settings, y);
        y = drawImagePair(state, "Recibido", money(request.getRecibido()), settings, y);
        return drawImagePair(state, "Cambio", money(request.getCambio()), settings, y);
    }

    private int renderCodeBlock(RenderState state, TicketPrintRequest request, JsonNode settings, int y) {
        int barWidth = Math.min(state.contentWidth, "80".equals(state.config.getPaperSize()) ? 260 : 210);
        int barHeight = 42;
        int x = alignedX(state, barWidth, settings.path("align").asText("CENTRO"));
        state.g.setColor(Color.BLACK);
        for (int i = 0; i < barWidth; i += 7) {
            int w = (i % 3 == 0) ? 3 : 1;
            state.g.fillRect(x + i, y, w, barHeight);
        }
        y += barHeight + 4;
        return drawWrapped(state, safe(request.getFolio()), settings.path("align").asText("CENTRO"), fontForBlock(state.config, settings, Font.PLAIN, 0.82f), false, y);
    }

    private int drawImagePair(RenderState state, String label, String value, JsonNode settings, int y) {
        Font labelFont = fontForPart(state.config, settings, "label", Font.PLAIN, 1.0f);
        Font valueFont = fontForPart(state.config, settings, "value", Font.BOLD, 1.0f);
        return drawImagePair(
                state,
                styled(label, settings, "label"),
                styled(value, settings, "value"),
                settings,
                y,
                labelFont,
                valueFont,
                settings.path("labelUnderline").asBoolean(false),
                settings.path("valueUnderline").asBoolean(false)
        );
    }

    private int drawImagePairIfPresent(RenderState state, String label, String value, JsonNode settings, int y) {
        return safe(value).isBlank() ? y : drawImagePair(state, label, value, settings, y);
    }

    private int drawImagePair(
            RenderState state,
            String label,
            String value,
            JsonNode settings,
            int y,
            Font labelFont,
            Font valueFont,
            boolean labelUnderline,
            boolean valueUnderline
    ) {
        Graphics2D g = state.g;
        String left = safe(label);
        String right = safe(value);
        FontMetrics valueMetrics = g.getFontMetrics(valueFont);
        int rightWidth = valueMetrics.stringWidth(right);
        int gap = 12;
        int leftMax = Math.max(40, state.contentWidth - rightWidth - gap);
        List<String> leftLines = wrapText(g, labelFont, left, leftMax);
        int lineHeight = Math.max(lineHeight(g, labelFont, state.config), lineHeight(g, valueFont, state.config));

        for (int i = 0; i < leftLines.size(); i++) {
            int baseline = y + g.getFontMetrics(labelFont).getAscent();
            drawTextAt(state, leftLines.get(i), state.contentX, baseline, labelFont, labelUnderline);
            if (i == 0) {
                int valueBaseline = y + g.getFontMetrics(valueFont).getAscent();
                drawTextAt(state, right, state.contentX + state.contentWidth - rightWidth, valueBaseline, valueFont, valueUnderline);
            }
            y += lineHeight;
        }
        return y + 1;
    }

    private int drawWrappedIfPresent(
            RenderState state,
            String text,
            String align,
            Font font,
            boolean underline,
            int y
    ) {
        return safe(text).isBlank() ? y : drawWrapped(state, text, align, font, underline, y);
    }

    private int drawWrapped(RenderState state, String text, String align, Font font, boolean underline, int y) {
        Graphics2D g = state.g;
        List<String> lines = wrapText(g, font, safe(text), state.contentWidth);
        int lineHeight = lineHeight(g, font, state.config);
        for (String line : lines) {
            int textWidth = g.getFontMetrics(font).stringWidth(line);
            int x = alignedX(state, textWidth, align);
            int baseline = y + g.getFontMetrics(font).getAscent();
            drawTextAt(state, line, x, baseline, font, underline);
            y += lineHeight;
        }
        return y + 1;
    }

    private void drawTextAt(RenderState state, String text, int x, int baseline, Font font, boolean underline) {
        state.g.setColor(Color.BLACK);
        state.g.setFont(font);
        state.g.drawString(text, x, baseline);
        if (underline) {
            FontMetrics metrics = state.g.getFontMetrics(font);
            state.g.drawLine(x, baseline + 2, x + metrics.stringWidth(text), baseline + 2);
        }
    }

    private int drawImageSeparator(RenderState state, int y) {
        String style = safe(state.config.getSeparatorStyle()).toUpperCase(Locale.ROOT);
        if ("NINGUNO".equals(style)) {
            return y + 2;
        }

        y += 7;
        Graphics2D g = state.g;
        g.setColor(Color.BLACK);
        Stroke previous = g.getStroke();
        if ("PUNTEADO".equals(style)) {
            g.setStroke(new BasicStroke(1.4f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10.0f, new float[]{6.0f, 5.0f}, 0.0f));
        } else {
            g.setStroke(new BasicStroke("DOBLE".equals(style) ? 1.6f : 1.2f));
        }
        g.drawLine(state.contentX, y, state.contentX + state.contentWidth, y);
        if ("DOBLE".equals(style)) {
            g.drawLine(state.contentX, y + 4, state.contentX + state.contentWidth, y + 4);
            y += 4;
        }
        g.setStroke(previous);
        return y + 8;
    }

    private List<String> wrapText(Graphics2D g, Font font, String text, int maxWidth) {
        List<String> lines = new ArrayList<>();
        String clean = safe(text);
        if (clean.isBlank()) {
            return lines;
        }

        FontMetrics metrics = g.getFontMetrics(font);
        StringBuilder current = new StringBuilder();
        for (String word : clean.split("\\s+")) {
            String candidate = current.isEmpty() ? word : current + " " + word;
            if (metrics.stringWidth(candidate) <= maxWidth) {
                current = new StringBuilder(candidate);
                continue;
            }
            if (!current.isEmpty()) {
                lines.add(current.toString());
            }
            current = new StringBuilder(word);
        }
        if (!current.isEmpty()) {
            lines.add(current.toString());
        }
        return lines;
    }

    private int alignedX(RenderState state, int itemWidth, String align) {
        String normalized = safe(align).toUpperCase(Locale.ROOT);
        if ("IZQUIERDA".equals(normalized)) {
            return state.contentX;
        }
        if ("DERECHA".equals(normalized)) {
            return state.contentX + Math.max(0, state.contentWidth - itemWidth);
        }
        return state.contentX + Math.max(0, (state.contentWidth - itemWidth) / 2);
    }

    private Font fontForPart(TicketConfigDTO config, JsonNode settings, String prefix, int defaultStyle, float factor) {
        int style = defaultStyle;
        if (settings.path(prefix + "Bold").asBoolean((defaultStyle & Font.BOLD) != 0)) {
            style |= Font.BOLD;
        } else {
            style &= ~Font.BOLD;
        }
        if (settings.path(prefix + "Italic").asBoolean(false)) {
            style |= Font.ITALIC;
        }
        return fontForBlock(config, settings, style, factor);
    }

    private Font fontForBlock(TicketConfigDTO config, JsonNode settings, int style, float factor) {
        int size = renderBaseFontSize(config);
        String blockSize = safe(settings.path("fontSize").asText(""));
        if ("CHICA".equalsIgnoreCase(blockSize)) {
            size -= 2;
        } else if ("GRANDE".equalsIgnoreCase(blockSize)) {
            size += 2;
        }
        size = Math.max(11, Math.round(size * factor));
        return new Font(resolveRenderFont(config.getFontFamily()), style, size);
    }

    private int blockStyle(JsonNode settings) {
        int style = Font.PLAIN;
        if (settings.path("bold").asBoolean(false)) {
            style |= Font.BOLD;
        }
        if (settings.path("italic").asBoolean(false)) {
            style |= Font.ITALIC;
        }
        return style;
    }

    private int renderBaseFontSize(TicketConfigDTO config) {
        String size = safe(config.getFontSize()).toUpperCase(Locale.ROOT);
        if ("CHICA".equals(size)) {
            return "80".equals(config.getPaperSize()) ? 18 : 16;
        }
        if ("GRANDE".equals(size)) {
            return "80".equals(config.getPaperSize()) ? 23 : 20;
        }
        return "80".equals(config.getPaperSize()) ? 20 : 18;
    }

    private String resolveRenderFont(String fontFamily) {
        String value = safe(fontFamily).toUpperCase(Locale.ROOT);
        if ("ARIAL".equals(value)) {
            return "Arial";
        }
        if ("COURIER".equals(value)) {
            return "Courier New";
        }
        if ("CONSOLAS".equals(value)) {
            return "Consolas";
        }
        return "Kodchasan";
    }

    private int lineHeight(Graphics2D g, Font font, TicketConfigDTO config) {
        return g.getFontMetrics(font).getHeight() + lineSpacingExtra(config);
    }

    private int lineSpacingExtra(TicketConfigDTO config) {
        String spacing = safe(config.getLineSpacing()).toUpperCase(Locale.ROOT);
        if ("COMPACTO".equals(spacing)) {
            return 0;
        }
        if ("AMPLIO".equals(spacing)) {
            return 5;
        }
        return 2;
    }

    private int densityBlockGap(TicketConfigDTO config) {
        String density = safe(config.getDensity()).toUpperCase(Locale.ROOT);
        if ("COMPACTA".equals(density)) {
            return 1;
        }
        if ("COMODA".equals(density)) {
            return 6;
        }
        return 3;
    }

    private int renderMargin(TicketConfigDTO config) {
        String margin = safe(config.getMarginSize()).toUpperCase(Locale.ROOT);
        if ("ESTRECHO".equals(margin)) {
            return "80".equals(config.getPaperSize()) ? 18 : 12;
        }
        if ("AMPLIO".equals(margin)) {
            return "80".equals(config.getPaperSize()) ? 38 : 26;
        }
        return "80".equals(config.getPaperSize()) ? 28 : 18;
    }

    private int logoTargetWidth(String size, int contentWidth) {
        String normalized = safe(size).toUpperCase(Locale.ROOT);
        if ("CHICO".equals(normalized)) {
            return Math.round(contentWidth * 0.28f);
        }
        if ("GRANDE".equals(normalized)) {
            return Math.round(contentWidth * 0.6f);
        }
        if ("EXTRA".equals(normalized)) {
            return Math.round(contentWidth * 0.76f);
        }
        if ("ANCHO".equals(normalized)) {
            return Math.round(contentWidth * 0.94f);
        }
        return Math.round(contentWidth * 0.44f);
    }

    private BufferedImage decodeLogo(TicketConfigDTO config) {
        try {
            String logo = storeRawText(config, "logoBase64");
            if (logo.isBlank()) {
                return null;
            }
            int comma = logo.indexOf(',');
            if (logo.startsWith("data:") && comma >= 0) {
                logo = logo.substring(comma + 1);
            }
            byte[] bytes = Base64.getDecoder().decode(logo);
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(bytes));
            if (original == null) {
                return null;
            }
            BufferedImage normalized = new BufferedImage(original.getWidth(), original.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = normalized.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, normalized.getWidth(), normalized.getHeight());
            g.drawImage(original, 0, 0, null);
            g.dispose();
            return normalized;
        } catch (Exception ignored) {
            return null;
        }
    }

    private List<String> contactParts(TicketConfigDTO config, JsonNode settings) {
        List<String> parts = new ArrayList<>();
        if (settings.path("showPhone").asBoolean(true) && !storeText(config, "telefono").isBlank()) {
            parts.add(storeText(config, "telefono"));
        }
        if (settings.path("showWhatsapp").asBoolean(true) && !storeText(config, "whatsapp").isBlank()) {
            parts.add((settings.path("showWhatsappIcon").asBoolean(true) ? "WhatsApp " : "") + storeText(config, "whatsapp"));
        }
        if (settings.path("showEmail").asBoolean(true) && !storeText(config, "correo").isBlank()) {
            parts.add(storeText(config, "correo"));
        }
        return parts;
    }

    private List<String> printableLines(String text) {
        String normalized = Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("\u2013", "-")
                .replace("\u2014", "-")
                .replace("\u201c", "\"")
                .replace("\u201d", "\"")
                .replace("\u2018", "'")
                .replace("\u2019", "'")
                .replaceAll("[^\\x09\\x0A\\x0D\\x20-\\x7E]", "");
        List<String> lines = new ArrayList<>();
        normalized.lines().forEach(lines::add);
        return lines;
    }

    private double mmToPoints(double mm) {
        return mm * 72.0 / 25.4;
    }

    private String resolvePrintFont(String fontFamily) {
        String value = safe(fontFamily).toUpperCase(Locale.ROOT);
        if ("ARIAL".equals(value)) {
            return "Arial";
        }
        if ("CONSOLAS".equals(value)) {
            return "Consolas";
        }
        return "Monospaced";
    }

    private int resolvePrintFontSize(TicketConfigDTO config) {
        String size = safe(config.getFontSize()).toUpperCase(Locale.ROOT);
        if ("CHICA".equals(size)) {
            return 7;
        }
        if ("GRANDE".equals(size)) {
            return 9;
        }
        return 8;
    }

    private String buildTicketText(TicketPrintRequest request, TicketConfigDTO config) {
        StringBuilder sb = new StringBuilder();
        int width = "80".equals(config.getPaperSize()) ? WIDTH_80 : WIDTH_58;
        JsonNode blocks = readBlocks(config.getTemplateJson());

        for (JsonNode block : blocks) {
            if (!block.path("visible").asBoolean(true)) {
                continue;
            }

            String type = block.path("type").asText("");
            JsonNode settings = block.path("settings");

            switch (type) {
                case "LOGO" -> appendLogo(sb, config, settings, width);
                case "STORE_HEADER" -> appendStoreHeader(sb, config, settings, width);
                case "SALE_INFO" -> appendSaleInfo(sb, request, settings, width);
                case "CUSTOMER" -> appendCustomer(sb, request, settings, width);
                case "PRODUCTS" -> appendProducts(sb, request, settings, width);
                case "TOTALS" -> appendTotals(sb, request, settings, width);
                case "PAYMENT" -> appendPayment(sb, request, settings, width);
                case "CASHIER" -> appendCashier(sb, request, settings, width);
                case "FOOTER_MESSAGE" -> appendText(
                        sb,
                        firstNonBlank(config.getFooterMessage(), storeText(config, "ticketMensaje"), "Gracias por su compra"),
                        settings,
                        config,
                        width
                );
                case "FOLIO_CODE" -> appendCode(sb, request, settings, width);
                case "CUSTOM_TEXT" -> appendText(sb, settings.path("text").asText(""), settings, config, width);
                default -> {
                }
            }

            if (settings.path("separatorAfter").asBoolean(true)) {
                appendSeparator(sb, config.getSeparatorStyle(), width);
            }
        }

        return sb.toString();
    }

    private JsonNode readBlocks(String templateJson) {
        try {
            JsonNode root = JSON.readTree(templateJson);
            JsonNode blocks = root.path("blocks");
            if (blocks.isArray()) {
                return blocks;
            }
        } catch (Exception ignored) {
        }

        try {
            return JSON.readTree("""
                    {"blocks":[
                      {"type":"STORE_HEADER","visible":true,"settings":{"separatorAfter":true}},
                      {"type":"SALE_INFO","visible":true,"settings":{"separatorAfter":true}},
                      {"type":"PRODUCTS","visible":true,"settings":{"separatorAfter":true}},
                      {"type":"TOTALS","visible":true,"settings":{"separatorAfter":true}},
                      {"type":"PAYMENT","visible":true,"settings":{"separatorAfter":true}},
                      {"type":"FOOTER_MESSAGE","visible":true,"settings":{"separatorAfter":false}}
                    ]}
                    """).path("blocks");
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo leer la plantilla de ticket", ex);
        }
    }

    private void appendLogo(StringBuilder sb, TicketConfigDTO config, JsonNode settings, int width) {
        if (Boolean.FALSE.equals(config.getShowLogo())) {
            return;
        }
        String logoText = firstNonBlank(storeText(config, "logoNombre"), "GALTEK ONE");
        if (logoText.contains(".")) {
            logoText = "GALTEK ONE";
        }
        appendAligned(sb, logoText, settings.path("align").asText("CENTRO"), width);
    }

    private void appendStoreHeader(StringBuilder sb, TicketConfigDTO config, JsonNode settings, int width) {
        String align = settings.path("align").asText("CENTRO");
        if (settings.path("showStoreName").asBoolean(true)) {
            appendAligned(sb, styled(storeText(config, "nombre"), settings, "name"), align, width);
        }
        if (settings.path("showFiscal").asBoolean(true)) {
            appendAlignedIfPresent(sb, styled(storeText(config, "razonSocial"), settings, "fiscal"), align, width);
            appendAlignedIfPresent(sb, styled(prefix("RFC ", storeText(config, "rfc")), settings, "fiscal"), align, width);
        }
        if (settings.path("showAddress").asBoolean(false)) {
            appendWrapped(sb, styled(buildAddress(config), settings, "address"), align, width);
        }
        if (settings.path("showContact").asBoolean(false)) {
            appendContact(sb, config, settings, width);
        }
    }

    private void appendSaleInfo(StringBuilder sb, TicketPrintRequest request, JsonNode settings, int width) {
        appendPair(sb, "Folio", safe(request.getFolio()), settings, width);
        appendPair(sb, "Fecha", firstNonBlank(request.getFecha(), LocalDateTime.now().format(PRINT_DATE_FORMAT)), settings, width);
    }

    private void appendCashier(StringBuilder sb, TicketPrintRequest request, JsonNode settings, int width) {
        appendPair(sb, "Caja", firstNonBlank(request.getCaja(), "Caja principal"), settings, width);
        appendPair(sb, "Cajero", firstNonBlank(request.getCajero(), "Caja"), settings, width);
    }

    private void appendCustomer(StringBuilder sb, TicketPrintRequest request, JsonNode settings, int width) {
        String cliente = firstNonBlank(request.getClienteNombre(), "Publico general");
        appendPair(sb, "Cliente", cliente, settings, width);
        appendPairIfPresent(sb, "Telefono", request.getClienteTelefono(), settings, width);
    }

    private void appendProducts(StringBuilder sb, TicketPrintRequest request, JsonNode settings, int width) {
        sb.append(leftRight("Producto", "Imp.", width)).append("\r\n");
        for (TicketPrintRequest.Item item : request.getItems()) {
            BigDecimal total = item.getTotal() == null
                    ? number(item.getPrecioUnitario()).multiply(number(item.getCantidad()))
                    : item.getTotal();
            sb.append(leftRight(safe(item.getNombre()), money(total), width)).append("\r\n");
            if (settings.path("showItemDetail").asBoolean(true)) {
                sb.append(limit(formatQuantity(item.getCantidad()) + " x " + money(item.getPrecioUnitario()), width))
                        .append("\r\n");
            }
        }
    }

    private void appendTotals(StringBuilder sb, TicketPrintRequest request, JsonNode settings, int width) {
        BigDecimal subtotal = request.getSubtotal() == null ? sumItems(request) : request.getSubtotal();
        BigDecimal discount = number(request.getDescuento());
        BigDecimal tax = number(request.getImpuesto());
        appendPair(sb, "Subtotal", money(subtotal), settings, width);
        if (discount.compareTo(BigDecimal.ZERO) != 0) {
            appendPair(sb, "Descuento", "-" + money(discount.abs()), settings, width);
        }
        if (tax.compareTo(BigDecimal.ZERO) != 0) {
            appendPair(sb, "Impuesto", money(tax), settings, width);
        }
        appendPair(sb, "Total", money(request.getTotal()), settings, width);
    }

    private void appendPayment(StringBuilder sb, TicketPrintRequest request, JsonNode settings, int width) {
        appendPair(sb, "Pago", titleCase(firstNonBlank(request.getMetodoPago(), "Efectivo")), settings, width);
        appendPair(sb, "Recibido", money(request.getRecibido()), settings, width);
        appendPair(sb, "Cambio", money(request.getCambio()), settings, width);
    }

    private void appendCode(StringBuilder sb, TicketPrintRequest request, JsonNode settings, int width) {
        appendAligned(sb, "[" + safe(request.getFolio()) + "]", settings.path("align").asText("CENTRO"), width);
    }

    private void appendContact(StringBuilder sb, TicketConfigDTO config, JsonNode settings, int width) {
        List<String> parts = new ArrayList<>();
        if (settings.path("showPhone").asBoolean(true) && !storeText(config, "telefono").isBlank()) {
            parts.add(storeText(config, "telefono"));
        }
        if (settings.path("showWhatsapp").asBoolean(true) && !storeText(config, "whatsapp").isBlank()) {
            parts.add((settings.path("showWhatsappIcon").asBoolean(true) ? "WhatsApp " : "") + storeText(config, "whatsapp"));
        }
        if (settings.path("showEmail").asBoolean(true) && !storeText(config, "correo").isBlank()) {
            parts.add(storeText(config, "correo"));
        }

        String align = settings.path("align").asText("CENTRO");
        if ("SALTO".equals(settings.path("contactLayout").asText("LINEA"))) {
            for (String part : parts) {
                appendAligned(sb, styled(part, settings, "contact"), align, width);
            }
            return;
        }
        appendWrapped(sb, styled(String.join(" | ", parts), settings, "contact"), align, width);
    }

    private void appendText(StringBuilder sb, String text, JsonNode settings, TicketConfigDTO config, int width) {
        appendWrapped(sb, styled(text, settings, ""), settings.path("align").asText(config.getAlignment()), width);
    }

    private void appendWrapped(StringBuilder sb, String text, String align, int width) {
        String remaining = safe(text);
        if (remaining.isBlank()) {
            return;
        }
        while (remaining.length() > width) {
            int split = remaining.lastIndexOf(' ', width);
            if (split < 1) {
                split = width;
            }
            appendAligned(sb, remaining.substring(0, split), align, width);
            remaining = remaining.substring(split).trim();
        }
        appendAligned(sb, remaining, align, width);
    }

    private void appendAlignedIfPresent(StringBuilder sb, String text, String align, int width) {
        if (!safe(text).isBlank()) {
            appendAligned(sb, text, align, width);
        }
    }

    private void appendAligned(StringBuilder sb, String text, String align, int width) {
        String value = limit(safe(text), width);
        String normalizedAlign = safe(align).toUpperCase(Locale.ROOT);
        if ("IZQUIERDA".equals(normalizedAlign)) {
            sb.append(value).append("\r\n");
            return;
        }
        if ("DERECHA".equals(normalizedAlign)) {
            int pad = Math.max(0, width - value.length());
            sb.append(" ".repeat(pad)).append(value).append("\r\n");
            return;
        }
        int pad = Math.max(0, (width - value.length()) / 2);
        sb.append(" ".repeat(pad)).append(value).append("\r\n");
    }

    private void appendPairIfPresent(StringBuilder sb, String label, String value, JsonNode settings, int width) {
        if (!safe(value).isBlank()) {
            appendPair(sb, label, value, settings, width);
        }
    }

    private void appendPair(StringBuilder sb, String label, String value, JsonNode settings, int width) {
        sb.append(leftRight(styled(label, settings, "label"), styled(value, settings, "value"), width)).append("\r\n");
    }

    private void appendSeparator(StringBuilder sb, String style, int width) {
        String normalized = safe(style).toUpperCase(Locale.ROOT);
        if ("NINGUNO".equals(normalized)) {
            return;
        }
        if ("PUNTEADO".equals(normalized)) {
            sb.append("- ".repeat(width / 2)).append("\r\n");
            return;
        }
        if ("DOBLE".equals(normalized)) {
            sb.append("=".repeat(width)).append("\r\n");
            return;
        }
        sb.append("-".repeat(width)).append("\r\n");
    }

    private String leftRight(String left, String right, int width) {
        String rightText = safe(right);
        String leftText = safe(left);
        int maxLeft = Math.max(1, width - rightText.length() - 1);
        leftText = limit(leftText, maxLeft);
        int spaces = Math.max(1, width - leftText.length() - rightText.length());
        return leftText + " ".repeat(spaces) + rightText;
    }

    private BigDecimal sumItems(TicketPrintRequest request) {
        return request.getItems().stream()
                .map(item -> item.getTotal() == null
                        ? number(item.getPrecioUnitario()).multiply(number(item.getCantidad()))
                        : item.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String money(BigDecimal value) {
        BigDecimal amount = value == null ? BigDecimal.ZERO : value;
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("es", "MX"));
        return formatter.format(amount.setScale(2, RoundingMode.HALF_UP)).replace("MX", "").trim();
    }

    private String formatQuantity(BigDecimal value) {
        BigDecimal quantity = value == null ? BigDecimal.ONE : value;
        return quantity.stripTrailingZeros().toPlainString();
    }

    private BigDecimal number(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String styled(String value, JsonNode settings, String prefix) {
        String text = safe(value);
        String normalizedPrefix = prefix == null ? "" : prefix;
        boolean blockUppercase = settings.path("uppercase").asBoolean(false);
        boolean partUppercase = !normalizedPrefix.isBlank()
                && settings.path(normalizedPrefix + "Uppercase").asBoolean(false);
        return blockUppercase || partUppercase ? text.toUpperCase(Locale.ROOT) : text;
    }

    private String buildAddress(TicketConfigDTO config) {
        List<String> parts = new ArrayList<>();
        addIfPresent(parts, storeText(config, "direccionCalle"));
        addIfPresent(parts, prefix("No. ", storeText(config, "direccionNumeroExterior")));
        addIfPresent(parts, prefix("Int. ", storeText(config, "direccionNumeroInterior")));
        addIfPresent(parts, storeText(config, "direccionColonia"));
        addIfPresent(parts, storeText(config, "direccionMunicipio"));
        addIfPresent(parts, storeText(config, "direccionEstado"));
        addIfPresent(parts, prefix("CP ", storeText(config, "direccionCodigoPostal")));
        String structured = String.join(", ", parts);
        return firstNonBlank(structured, storeText(config, "direccion"));
    }

    private void addIfPresent(List<String> parts, String value) {
        String text = safe(value);
        if (!text.isBlank()) {
            parts.add(text);
        }
    }

    private String storeText(TicketConfigDTO config, String key) {
        Object value = config.getTienda() == null ? null : config.getTienda().get(key);
        return safe(value == null ? "" : String.valueOf(value));
    }

    private String storeRawText(TicketConfigDTO config, String key) {
        Object value = config.getTienda() == null ? null : config.getTienda().get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String prefix(String prefix, String value) {
        return safe(value).isBlank() ? "" : prefix + safe(value);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String text = safe(value);
            if (!text.isBlank()) {
                return text;
            }
        }
        return "";
    }

    private String titleCase(String value) {
        String text = safe(value).replace("_", " ").toLowerCase(Locale.ROOT);
        if (text.isBlank()) {
            return text;
        }
        return text.substring(0, 1).toUpperCase(Locale.ROOT) + text.substring(1);
    }

    private String limit(String value, int max) {
        String text = safe(value);
        if (text.length() <= max) {
            return text;
        }
        return text.substring(0, Math.max(0, max - 1)) + ".";
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\r", " ").replace("\n", " ").trim();
    }

    private static class RenderState {
        private final Graphics2D g;
        private final TicketConfigDTO config;
        private final int width;
        private final int contentX;
        private final int contentWidth;

        RenderState(Graphics2D g, TicketConfigDTO config, int width, int margin) {
            this.g = g;
            this.config = config;
            this.width = width;
            this.contentX = margin;
            this.contentWidth = Math.max(80, width - margin * 2);
        }
    }

    private static class TicketPrintable implements Printable {
        private final List<String> lines;
        private final Font font;
        private final double lineHeight;

        TicketPrintable(List<String> lines, Font font, double lineHeight) {
            this.lines = lines;
            this.font = font;
            this.lineHeight = lineHeight;
        }

        @Override
        public int print(Graphics graphics, PageFormat pageFormat, int pageIndex) {
            if (pageIndex > 0) {
                return NO_SUCH_PAGE;
            }

            Graphics2D g2 = (Graphics2D) graphics;
            g2.setColor(Color.BLACK);
            g2.setFont(font);

            FontMetrics metrics = g2.getFontMetrics(font);
            float x = (float) pageFormat.getImageableX();
            float y = (float) (pageFormat.getImageableY() + metrics.getAscent());
            for (String line : lines) {
                g2.drawString(line, x, y);
                y += (float) lineHeight;
            }
            return PAGE_EXISTS;
        }
    }
}
