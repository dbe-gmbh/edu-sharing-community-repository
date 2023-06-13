package org.edu_sharing.saml;

import org.apache.log4j.Logger;
import org.opensaml.xml.security.SecurityException;
import org.opensaml.xml.security.x509.PKIXTrustEvaluator;
import org.opensaml.xml.security.x509.PKIXValidationInformation;
import org.opensaml.xml.security.x509.PKIXValidationOptions;
import org.opensaml.xml.security.x509.X509Credential;

import java.io.FileInputStream;
import java.io.IOException;
import java.net.URL;
import java.security.*;
import java.security.cert.*;
import java.security.cert.Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Enumeration;

public class ESPKIXTrustEvaluator implements PKIXTrustEvaluator {

    Logger logger = Logger.getLogger(ESPKIXTrustEvaluator.class);

    private final PKIXValidationOptions options;

    public ESPKIXTrustEvaluator() {
        options = new PKIXValidationOptions();
    }

    String keystorePassword;
    String keystorePath;

    boolean acceptAll = false;

    Integer removeFromCertChainIdx = -1;

    @Override
    public boolean validate(PKIXValidationInformation validationInfo, X509Credential untrustedCredential) throws SecurityException {

        if(acceptAll) return true;

        boolean valid = false;
        try {

            String cacertsPath = (keystorePath != null) ? keystorePath : System.getProperty("java.home") + "/lib/security/cacerts";
            FileInputStream fis = new FileInputStream(cacertsPath);
            KeyStore cacerts = KeyStore.getInstance(KeyStore.getDefaultType());
            String pw = (keystorePassword != null) ? keystorePassword : "changeit";
            cacerts.load(fis, pw.toCharArray());


            PKIXParameters params = new PKIXParameters(cacerts);
            //must be false
            params.setRevocationEnabled(false); // Optional: Set revocation checking to enabled or disabled.
            Collection<X509Certificate> entityCertificateChain = untrustedCredential.getEntityCertificateChain();
            ArrayList<X509Certificate> list  = new ArrayList<>(entityCertificateChain);
            /**
             * we need to remove in our testcase with letsencrypt the first root cert (seems not to be in keystore)
             *
             * 2 -> Issuer -> CN=DST Root CA X3, O=Digital Signature Trust Co.
             * 1 -> Issuer -> CN=ISRG Root X1, O=Internet Security Research Group, C=US
             * 0 -> CN=R3, O=Let's Encrypt, C=US
             *
             */
            int removeIdx = (removeFromCertChainIdx == -1 ) ? (list.size() - 1): removeFromCertChainIdx;
            list.remove(removeIdx);
            CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
            CertPath certPath = certFactory.generateCertPath(list);

            CertPathValidator certPathValidator = CertPathValidator.getInstance(CertPathValidator.getDefaultType());

            CertPathValidatorResult result = certPathValidator.validate(certPath, params);
            PKIXCertPathValidatorResult rs = (PKIXCertPathValidatorResult)result;
            logger.debug("validate success with trusted ca "+rs.getTrustAnchor().getCAName());
            valid = true;


            // Close the FileInputStream
            fis.close();
        } catch (Throwable e){
            logger.error(e.getMessage(),e);
            throw new RuntimeException(e);
        }
        return valid;
    }

    @Override
    public PKIXValidationOptions getPKIXValidationOptions() {
        return options;
    }


    public void setKeystorePassword(String keystorePassword) {
        this.keystorePassword = keystorePassword;
    }

    public void setKeystorePath(String keystorePath) {
        this.keystorePath = keystorePath;
    }

    public void setAcceptAll(boolean acceptAll) {
        this.acceptAll = acceptAll;
    }

    public void setRemoveFromCertChainIdx(Integer removeFromCertChainIdx) {
        this.removeFromCertChainIdx = removeFromCertChainIdx;
    }
}
