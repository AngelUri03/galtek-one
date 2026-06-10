package com.galtekone.crypto;

import org.bouncycastle.asn1.ASN1Primitive;
import org.bouncycastle.asn1.pkcs.RSAPrivateKey;
import org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers;
import org.bouncycastle.asn1.x509.AlgorithmIdentifier;
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.*;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PemUtils {
  private PemUtils() {}

  public static PublicKey parsePublicKeyFromPem(String input) throws Exception {
    String s = normalize(input);

    if (s.contains("BEGIN")) {
      if (s.contains("BEGIN PUBLIC KEY")) {
        byte[] der = decodeBlock(s, "PUBLIC KEY");
        return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
      }
      if (s.contains("BEGIN RSA PUBLIC KEY")) {
        byte[] pkcs1Der = decodeBlock(s, "RSA PUBLIC KEY");
        byte[] spkiDer  = wrapPkcs1PublicIntoSpki(pkcs1Der);
        return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(spkiDer));
      }
      throw new IllegalArgumentException("Formato PEM público no soportado");
    }

    byte[] der = Base64.getDecoder().decode(onlyBase64(s));
    try {
      return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
    } catch (Exception ignore) {
      byte[] spkiDer = wrapPkcs1PublicIntoSpki(der);
      return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(spkiDer));
    }
  }


  public static PrivateKey parsePrivateKeyFromPem(String input) throws Exception {
    String s = normalize(input);

    if (s.contains("BEGIN")) {
      if (s.contains("BEGIN PRIVATE KEY")) {
        byte[] der = decodeBlock(s, "PRIVATE KEY");
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
      }
      if (s.contains("BEGIN RSA PRIVATE KEY")) {
        byte[] pkcs1Der = decodeBlock(s, "RSA PRIVATE KEY");
        return privateKeyFromPkcs1(pkcs1Der);
      }
      throw new IllegalArgumentException("Formato PEM privado no soportado");
    }

    byte[] der = Base64.getDecoder().decode(onlyBase64(s));
    try {
      return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    } catch (Exception ignore) {
      return privateKeyFromPkcs1(der);
    }
  }


  private static String normalize(String s) {
    if (s == null) throw new IllegalArgumentException("Clave nula");
    if (!s.isEmpty() && s.charAt(0) == '\uFEFF') s = s.substring(1);
    return s.replace("\r", "").trim();
  }

  private static String extractBase64Block(String pem, String type) {
    String begin = "-----BEGIN " + type + "-----";
    String end   = "-----END " + type + "-----";
    Pattern p = Pattern.compile(Pattern.quote(begin) + "\\s*(.*?)\\s*" + Pattern.quote(end), Pattern.DOTALL);
    Matcher m = p.matcher(pem);
    if (!m.find()) throw new IllegalArgumentException("No se encontró bloque PEM: " + type);
    return m.group(1).replaceAll("[^A-Za-z0-9+/=]", "");
  }

  private static byte[] decodeBlock(String pem, String type) {
    String b64 = extractBase64Block(pem, type);
    return Base64.getDecoder().decode(b64);
  }

  private static String onlyBase64(String s) {
    return s.replaceAll("[^A-Za-z0-9+/=]", "");
  }

  private static byte[] wrapPkcs1PublicIntoSpki(byte[] pkcs1Der) throws Exception {
    var asn1Pub = ASN1Primitive.fromByteArray(pkcs1Der);
    var algId   = new AlgorithmIdentifier(PKCSObjectIdentifiers.rsaEncryption);
    var spki    = new SubjectPublicKeyInfo(algId, asn1Pub);
    return spki.getEncoded(); 
  }

  private static PrivateKey privateKeyFromPkcs1(byte[] pkcs1Der) throws Exception {
    RSAPrivateKey pk = RSAPrivateKey.getInstance(ASN1Primitive.fromByteArray(pkcs1Der));
    var spec = new RSAPrivateCrtKeySpec(
        pk.getModulus(),
        pk.getPublicExponent(),
        pk.getPrivateExponent(),
        pk.getPrime1(),
        pk.getPrime2(),
        pk.getExponent1(),
        pk.getExponent2(),
        pk.getCoefficient()
    );
    return KeyFactory.getInstance("RSA").generatePrivate(spec);
  }
}