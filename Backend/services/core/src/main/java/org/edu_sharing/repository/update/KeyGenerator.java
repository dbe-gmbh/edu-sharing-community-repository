package org.edu_sharing.repository.update;

import java.io.FileOutputStream;
import java.io.PrintWriter;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;

import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.server.tools.ApplicationInfo;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;
import org.edu_sharing.repository.server.tools.KeyTool;
import org.edu_sharing.repository.server.tools.PropertiesHelper;
import org.edu_sharing.repository.server.tools.security.KeyStoreService;
import org.edu_sharing.repository.server.tools.security.Signing;

public class KeyGenerator extends UpdateAbstract {

	public static final String ID = "KeyGenerator";

	public static final String description = "generates public and private key in homeApplication if they don't exsist";

	public KeyGenerator(PrintWriter _out) {
		out = _out;
		logger = Logger.getLogger(KeyGenerator.class);
	}

	@Override
	public void execute() {
		doIt(false);
	}

	@Override
	public String getDescription() {
		return description;
	}

	public String getId() {
		return ID;
	};

	@Override
	public void test() {
		doIt(true);
	}

	private void doIt(boolean test) {
		ApplicationInfo homeRepo = ApplicationInfoList.getHomeRepository();

		Signing s = new Signing();

		KeyPair kp = s.generateKeys();
		try {
			String file = PropertiesHelper.Config.getAbsolutePathForConfigFile(
					PropertiesHelper.Config.getPropertyFilePath(CCConstants.REPOSITORY_FILE_HOME)
			);
			if (homeRepo.getPublicKey() == null) {

				logInfo("will set public key");
				if (!test) {

					String pubKeyString = "-----BEGIN PUBLIC KEY-----\n"
							+ new String(new Base64().encode(kp.getPublic().getEncoded())) + "-----END PUBLIC KEY-----";

					PropertiesHelper.setProperty(ApplicationInfo.KEY_PUBLIC_KEY, pubKeyString,
							file, PropertiesHelper.XML);
				}

			}

			if (homeRepo.getPrivateKey() == null) {
				logInfo("will set private key");

				if (!test) {
					PropertiesHelper.setProperty(ApplicationInfo.KEY_PRIVATE_KEY,
							new String(new Base64().encode(kp.getPrivate().getEncoded())),
							file, PropertiesHelper.XML);
				}

			}

			/**
			 * Keystore for username hashing in logs
			 */
			KeyTool keyTool = new KeyTool();
			//check if keystore password is set
			if(homeRepo.getKeyStorePassword() == null){
				logInfo("will generate keystore password and default passwords");
				if(!test){
					String keyStorePw = keyTool.getRandomPassword();
					PropertiesHelper.setProperty(ApplicationInfo.KEY_KEYSTORE_PW,
							keyStorePw,
							file, PropertiesHelper.XML);
					ApplicationInfoList.refresh();
					homeRepo = ApplicationInfoList.getHomeRepository();
				}
			}

			//create keystore if not exists
			KeyStoreService keyStoreService = new KeyStoreService();
			keyStoreService.getKeyStore(CCConstants.EDU_PASSWORD_KEYSTORE_NAME,homeRepo.getKeyStorePassword());

			//check for keystore entry
			String pwUserNameHash = keyStoreService.readPasswordFromKeyStore(CCConstants.EDU_PASSWORD_KEYSTORE_NAME, homeRepo.getKeyStorePassword(), "", CCConstants.EDU_PASSWORD_USERNAMEHASH);
			if(pwUserNameHash == null){
				logger.info("pwUserNameHash does not exist. adding...");
				keyStoreService.writePasswordToKeyStore(CCConstants.EDU_PASSWORD_KEYSTORE_NAME,
						homeRepo.getKeyStorePassword(),
						"",
						CCConstants.EDU_PASSWORD_USERNAMEHASH,
						keyTool.getRandomPassword());
			}





		} catch (Exception e) {
			logError(e.getMessage(), e);
		}

	}

	public static void main(String[] args) {

		Signing s = new Signing();

		KeyPair kp = s.generateKeys();

		System.out.println(new String(new Base64().encode(kp.getPublic().getEncoded())));

		try {
			KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
			keyPairGenerator.initialize(1024);
			KeyPair keyPair = keyPairGenerator.genKeyPair();
			String publicKeyFilename = "public";

			byte[] publicKeyBytes = keyPair.getPublic().getEncoded();

			FileOutputStream fos = new FileOutputStream(publicKeyFilename);
			fos.write(publicKeyBytes);
			fos.close();

			System.out.println(PropertiesHelper.getProperty(ApplicationInfo.KEY_PRIVATE_KEY,
					CCConstants.REPOSITORY_FILE_HOME, PropertiesHelper.XML));

			Signing signing = new Signing();

			PrivateKey pk = signing.getPemPrivateKey(PropertiesHelper.getProperty(ApplicationInfo.KEY_PRIVATE_KEY,
					CCConstants.REPOSITORY_FILE_HOME, PropertiesHelper.XML), CCConstants.SECURITY_KEY_ALGORITHM);

			String data = "hello world";
			byte[] signature = signing.sign(pk, data, CCConstants.SECURITY_SIGN_ALGORITHM);

			PublicKey pubK = signing.getPemPublicKey(PropertiesHelper.getProperty(ApplicationInfo.KEY_PUBLIC_KEY,
					CCConstants.REPOSITORY_FILE_HOME, PropertiesHelper.XML), CCConstants.SECURITY_KEY_ALGORITHM);
			System.out.println("verify:" + signing.verify(pubK, signature, data, CCConstants.SECURITY_SIGN_ALGORITHM));

		} catch (Exception e) {
			e.printStackTrace();
		}

	}
	
	@Override
	public void run() {
		this.logInfo("not implemented");
	}
}
