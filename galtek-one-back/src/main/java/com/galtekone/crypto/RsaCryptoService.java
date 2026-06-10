package com.galtekone.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.MGF1ParameterSpec;
import java.util.Base64;

@Service
public class RsaCryptoService {

    private static final int KEY_SIZE = 3072;

    private final PublicKey publicKey;
    private final PrivateKey privateKey;
    private final String publicPem;

    public RsaCryptoService(@Value("${app.rsa.public-path}") String publicPath,
            @Value("${app.rsa.private-path}") String privatePath) {
        try {
            Path pubPath = Path.of(publicPath);
            Path privPath = Path.of(privatePath);
            ensureKeys(pubPath, privPath);

            String pubPem = Files.readString(pubPath, StandardCharsets.UTF_8);
            String privPem = Files.readString(privPath, StandardCharsets.UTF_8);
            this.publicKey = PemUtils.parsePublicKeyFromPem(pubPem);
            this.privateKey = PemUtils.parsePrivateKeyFromPem(privPem);
            this.publicPem = pubPem;
        } catch (Exception e) {
            throw new IllegalStateException("No se pudieron cargar las llaves RSA", e);
        }
    }

    public String getPublicKeyPem() {
        return publicPem;
    }

    public String encryptBase64(String plain) {
        try {
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            OAEPParameterSpec oaep = new OAEPParameterSpec("SHA-256", "MGF1", new MGF1ParameterSpec("SHA-256"),
                    PSource.PSpecified.DEFAULT);
            cipher.init(Cipher.ENCRYPT_MODE, publicKey, oaep);
            byte[] ct = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ct);
        } catch (Exception e) {
            throw new IllegalStateException("Error cifrando con RSA", e);
        }
    }

    public String decryptBase64(String base64Cipher) {
        try {
            byte[] cipherBytes = Base64.getDecoder().decode(base64Cipher);
            Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            OAEPParameterSpec oaep = new OAEPParameterSpec("SHA-256", "MGF1", new MGF1ParameterSpec("SHA-256"),
                    PSource.PSpecified.DEFAULT);
            cipher.init(Cipher.DECRYPT_MODE, privateKey, oaep);
            byte[] plain = cipher.doFinal(cipherBytes);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Error descifrando con RSA", e);
        }
    }

    private static void ensureKeys(Path publicPath, Path privatePath) throws Exception {
        if (Files.exists(publicPath) && Files.exists(privatePath)) {
            return;
        }

        createParent(publicPath);
        createParent(privatePath);

        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(KEY_SIZE);
        KeyPair keyPair = generator.generateKeyPair();

        Files.writeString(publicPath, toPem("PUBLIC KEY", keyPair.getPublic().getEncoded()), StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        Files.writeString(privatePath, toPem("PRIVATE KEY", keyPair.getPrivate().getEncoded()), StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
    }

    private static void createParent(Path path) throws Exception {
        Path parent = path.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
    }

    private static String toPem(String type, byte[] der) {
        String base64 = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8)).encodeToString(der);
        return "-----BEGIN " + type + "-----\n" + base64 + "\n-----END " + type + "-----\n";
    }
}