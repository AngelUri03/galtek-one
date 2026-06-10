package com.galtekone.crypto;

import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RsaKeyStoreService {

	@Value("${app.rsa.public-path}")
	private String publicPathStr;

	@Value("${app.rsa.private-path}")
	private String privatePathStr;

	private static final int KEY_SIZE = 3072;

	public boolean generateAndSave(boolean overwrite) {
		try {
			Path pub = Paths.get(publicPathStr);
			Path priv = Paths.get(privatePathStr);

			ensureParent(pub);
			ensureParent(priv);

			boolean bothExist = Files.exists(pub) && Files.exists(priv);
			if (bothExist && !overwrite)
				return false;

			KeyPair kp = generateRsaKeyPair(KEY_SIZE);
			String publicPem = toPem("PUBLIC KEY", kp.getPublic().getEncoded());
			String privatePem = toPem("PRIVATE KEY", kp.getPrivate().getEncoded());

			writePem(priv, privatePem, true);
			writePem(pub, publicPem, false);

			return Files.size(priv) > 0 && Files.size(pub) > 0;
		} catch (Exception e) {
			throw new IllegalStateException("No se pudieron generar/guardar las llaves RSA", e);
		}
	}

	private static void ensureParent(Path path) throws IOException {
		Path parent = path.getParent();
		if (parent != null)
			Files.createDirectories(parent);
	}

	private static KeyPair generateRsaKeyPair(int size) throws NoSuchAlgorithmException {
		KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
		gen.initialize(size);
		return gen.generateKeyPair();
	}

	private static void writePem(Path path, String pem, boolean strictPerms) throws IOException {
		Files.writeString(path, pem, StandardCharsets.UTF_8, StandardOpenOption.CREATE,
				StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);

		try (FileChannel ch = FileChannel.open(path, StandardOpenOption.WRITE)) {
			ch.force(true);
		}
	}

	private static String toPem(String type, byte[] der) {
		String base64 = Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8)).encodeToString(der);
		return "-----BEGIN " + type + "-----\n" + base64 + "\n-----END " + type + "-----\n";
	}
}
