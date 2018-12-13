/**
 * RenderInfoSoapBindingImpl.java
 *
 * This file was auto-generated from WSDL
 * by the Apache Axis 1.4 Apr 22, 2006 (06:55:48 PDT) WSDL2Java emitter.
 */

package org.edu_sharing.webservices.render;

import java.io.Serializable;
import java.io.UnsupportedEncodingException;
import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.mail.Store;
import javax.servlet.http.HttpSession;
import javax.xml.soap.SOAPException;

import org.alfresco.repo.search.impl.querymodel.impl.functions.Child;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.security.PermissionService;
import org.apache.axis.AxisFault;
import org.apache.axis.MessageContext;
import org.apache.axis.message.SOAPHeaderElement;
import org.apache.log4j.Logger;
import org.edu_sharing.metadataset.v2.MetadataReaderV2;
import org.edu_sharing.metadataset.v2.MetadataSetV2;
import org.edu_sharing.metadataset.v2.tools.MetadataTemplateRenderer;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.client.tools.MimeTypes;
import org.edu_sharing.repository.client.tools.Theme;
import org.edu_sharing.repository.client.tools.metadata.ValueTool;
import org.edu_sharing.repository.server.AuthenticationToolAPI;
import org.edu_sharing.repository.server.MCAlfrescoAPIClient;
import org.edu_sharing.repository.server.authentication.Context;
import org.edu_sharing.repository.server.tools.ApplicationInfo;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;
import org.edu_sharing.repository.server.tools.LocaleValidator;
import org.edu_sharing.repository.server.tools.URLTool;
import org.edu_sharing.repository.server.tools.VCardConverter;
import org.edu_sharing.service.license.LicenseService;
import org.edu_sharing.service.mime.MimeTypesV2;
import org.edu_sharing.service.nodeservice.NodeService;
import org.edu_sharing.service.nodeservice.NodeServiceFactory;
import org.edu_sharing.service.nodeservice.NodeServiceHelper;
import org.edu_sharing.service.permission.PermissionServiceFactory;
import org.edu_sharing.service.permission.PermissionServiceHelper;
import org.edu_sharing.service.usage.AlfServicesWrapper;
import org.edu_sharing.service.usage.UsageDAO;
import org.edu_sharing.service.usage.UsageService;
import org.edu_sharing.webservices.types.KeyValue;
import org.edu_sharing.webservices.usage.UsageResult;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class RenderInfoSoapBindingImpl implements org.edu_sharing.webservices.render.RenderInfo,Serializable{
	
	public static String EXCEPTION_NODE_DOES_NOT_EXISTS = "EXCEPTION_NODE_DOES_NOT_EXISTS";
	public static String EXCEPTION_VERSION_DOES_NOT_EXISTS = "EXCEPTION_VERSION_DOES_NOT_EXISTS";
	public static String EXCEPTION_USER_DOES_NOT_EXISTS = "EXCEPTION_USER_DOES_NOT_EXISTS";
	
	private static Logger logger = Logger.getLogger(RenderInfoSoapBindingImpl.class);

	@Override
	public RenderInfoResult getRenderInfoLMS(String userName, String nodeId, String lmsId, String courseId, String resourceId, String version)
			throws RemoteException {
		
		AuthenticationToolAPI authTool = new AuthenticationToolAPI();
		ApplicationInfo homeAppInfo  = ApplicationInfoList.getHomeRepository();
		String ticket = null;
		
		try {
			
			ticket = authTool.createNewSession(homeAppInfo.getUsername(), homeAppInfo.getPassword()).get(CCConstants.AUTH_TICKET);
			MCAlfrescoAPIClient client = new MCAlfrescoAPIClient();
			RenderInfoResult result = getBaseData(userName, nodeId, version, client);
			UsageDAO usageDao = new AlfServicesWrapper();
			if(lmsId!=null && courseId!=null) {
				HashMap<String, Object> usageMap = usageDao.getUsageOnNodeOrParents(lmsId, courseId, nodeId, resourceId);
				if (usageMap != null) {
					result.setUsage(transform(new UsageService().getUsageResult(usageMap)));
				}
			}
			return result;
			
		} catch(RemoteException e) {
			throw e;
		} catch(Throwable e) {
			logger.error(e.getMessage(), e);
			throw new RemoteException("getRenderInfoLMS failed");
		} finally {
			if (ticket != null) {
				authTool.logout(ticket);
			}
		}
	}
	
	@Override
	public RenderInfoResult getRenderInfoRepo(String userName, String nodeId, String version) throws RemoteException {
		
		AuthenticationToolAPI authTool = new AuthenticationToolAPI();
		ApplicationInfo homeAppInfo  = ApplicationInfoList.getHomeRepository();
		String ticket = null;
		
		try{
			
			ticket = authTool.createNewSession(homeAppInfo.getUsername(), homeAppInfo.getPassword()).get(CCConstants.AUTH_TICKET);
			MCAlfrescoAPIClient client = new MCAlfrescoAPIClient();
			return getBaseData(userName, nodeId, version, client);
			
		} catch (RemoteException e) {
			throw e;
		} catch (Throwable e) {
			logger.error(e.getMessage(), e);
			throw new RemoteException("getRenderInfoRepo failed");
		} finally {
			if (ticket != null) {
				authTool.logout(ticket);
			}
		}
	}
	
	private UsageResult transform(org.edu_sharing.service.usage.Usage serviceUsage) {
		UsageResult result = new UsageResult();

		result.setAppUser(serviceUsage.getAppUser());
		result.setAppUserMail(serviceUsage.getAppUserMail());
		result.setCourseId(serviceUsage.getCourseId());
		result.setDistinctPersons(serviceUsage.getDistinctPersons());
		result.setFromUsed(serviceUsage.getFromUsed());
		result.setLmsId(serviceUsage.getLmsId());
		result.setNodeId(serviceUsage.getNodeId());
		result.setParentNodeId(serviceUsage.getParentNodeId());
		result.setResourceId(serviceUsage.getResourceId());
		result.setToUsed(serviceUsage.getToUsed());
		result.setUsageCounter(serviceUsage.getUsageCounter());
		result.setUsageVersion(serviceUsage.getUsageVersion());
		result.setUsageXmlParams(serviceUsage.getUsageXmlParams());
		return result;
	}
	
	
	private RenderInfoResult getBaseData(String userName, String nodeId, String version, MCAlfrescoAPIClient client) throws RemoteException, Throwable{
		NodeService nodeService=NodeServiceFactory.getLocalService();
		org.edu_sharing.service.permission.PermissionService permissionService=PermissionServiceFactory.getLocalService();
		if (!nodeService.exists(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId)) {
			throw new RemoteException(EXCEPTION_NODE_DOES_NOT_EXISTS);
		}
		
		if (userName == null || userName.trim().equals("")) {
			userName = "guest";
		}
		
		RenderInfoResult rir = new RenderInfoResult();
		
		HashMap<String, String> userInfo = client.getUserInfo(userName);
		if(userInfo == null){
			throw new RemoteException(EXCEPTION_USER_DOES_NOT_EXISTS);
		}
		
		String primaryAffiliation = userInfo.get(CCConstants.CM_PROP_PERSON_EDU_SCHOOL_PRIMARY_AFFILIATION);
		if(primaryAffiliation != null && !primaryAffiliation.equals("")) {
			rir.setEduSchoolPrimaryAffiliation(primaryAffiliation);
		}
		
		String remoteRoles = userInfo.get(CCConstants.PROP_USER_ESREMOTEROLES);
		if(remoteRoles != null && !remoteRoles.trim().equals("")) {
			remoteRoles = remoteRoles.replace("[", "");
			remoteRoles = remoteRoles.replace("]", "");
			remoteRoles = remoteRoles.replaceAll(" ", "");
			String[] splitted = remoteRoles.split(",");
			rir.setRemoteRoles(splitted);
		}

		HashMap<String, Boolean> perms = permissionService.hasAllPermissions(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId, userName, new String[]{CCConstants.PERMISSION_READ,CCConstants.PERMISSION_CC_PUBLISH});

		rir.setPermissions(PermissionServiceHelper.getPermissionsAsString(perms).toArray(new String[0]));
		rir.setPublishRight(new Boolean(perms.get(CCConstants.PERMISSION_CC_PUBLISH)));
		rir.setUserReadAllowed(new Boolean(perms.get(PermissionService.READ)));
		
		//this does not work anymore in alfresco-5.0.d:
		//HashMap<String, Boolean> permsGuest = client.hasAllPermissions(nodeId, PermissionService.ALL_AUTHORITIES, new String[]{PermissionService.READ});
		HashMap<String, Boolean> permsGuest = permissionService.hasAllPermissions(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId, PermissionService.GUEST_AUTHORITY, new String[]{PermissionService.READ});
		rir.setGuestReadAllowed(new Boolean(permsGuest.get(PermissionService.READ)));

		HashMap versionProps = null;
		boolean collectionRefOriginalDeleted = false;
		
		String[] aspects =  client.getAspects(nodeId);
		if (Arrays.asList(aspects).contains(CCConstants.CCM_ASPECT_COLLECTION_IO_REFERENCE)){
			
			String refNodeId = client.getProperty(MCAlfrescoAPIClient.storeRef, nodeId, CCConstants.CCM_PROP_IO_ORIGINAL);
			
			collectionRefOriginalDeleted=AuthenticationUtil.runAsSystem(new RunAsWork<Boolean>() {
				@Override
				public Boolean doWork() throws Exception {
					if(client.exists(refNodeId)){
						// May no permission on main object.
						rir.setContentHash(client.getContentHash(refNodeId,CCConstants.CM_PROP_CONTENT));
						return false;
					}
					return true;
				}
			});
			
		} else if(version != null && !version.trim().equals("") && !version.trim().equals("-1")){
			
			HashMap<String, HashMap<String,Object>> versionHIstory = client.getVersionHistory(nodeId);
			for(Map.Entry<String, HashMap<String,Object>> entry : versionHIstory.entrySet()){
				
				HashMap tmpVersionProps = entry.getValue();
				String vlable = (String)tmpVersionProps.get(CCConstants.CM_PROP_VERSIONABLELABEL);
				if(version.equals(vlable)){
					versionProps = tmpVersionProps;
				}
				
			}
			
			if(versionProps == null){
				throw new RemoteException(EXCEPTION_VERSION_DOES_NOT_EXISTS);
			}
			String versionStoreNodeId = (String)versionProps.get(CCConstants.VERSION_STORE_NODEID);
			rir.setContentHash(client.getContentHash(versionStoreNodeId,CCConstants.CM_PROP_CONTENT,MCAlfrescoAPIClient.versionStoreRef.getProtocol(),MCAlfrescoAPIClient.versionStoreRef.getIdentifier()));
		}else{
			rir.setContentHash(client.getContentHash(nodeId,CCConstants.CM_PROP_CONTENT));
		}



		String locale = getHeaderValue("locale", MessageContext.getCurrentContext());

		locale = (locale != null) ? locale : "en_EN";
		
		HttpSession session = Context.getCurrentInstance().getRequest().getSession();
		if(LocaleValidator.validate(locale)){
			session.setAttribute(CCConstants.AUTH_LOCALE, locale);
		}
		
		//properties without clientinfo cause of admin etc. ticket 
		NodeRef nodeRef = new NodeRef(MCAlfrescoAPIClient.storeRef,nodeId);
		Map<String,Object> props = (versionProps == null) ? client.getPropertiesCached(nodeRef, true, true, false) : versionProps;//client.getProperties(nodeId);
        // fix axis bug that emoji crash: https://issues.apache.org/jira/browse/AXIS-2908
		props=removeUTF16Chars(props);

		// child object: inherit all props from parent
		if(Arrays.asList(aspects).contains(CCConstants.CCM_ASPECT_IO_CHILDOBJECT)){
			ChildAssociationRef parentRef = client.getParent(nodeRef);
			Map<String,Object> propsParent = new HashMap<String, Object>(client.getPropertiesCached(parentRef.getParentRef(), true, true, false));
			// override it with the props from the child
			for(Map.Entry<String,Object> entry : props.entrySet()){
				propsParent.put(entry.getKey(),entry.getValue());
			}
			props=propsParent;
		}
		String nodeType = (String)props.get(CCConstants.NODETYPE);
		boolean isRemoteObject = CCConstants.CCM_TYPE_REMOTEOBJECT.equals(nodeType);
		ApplicationInfo appInfo=ApplicationInfoList.getHomeRepository();
		if(isRemoteObject){
			// 4.0: Fetch actual metadata from the remote object
			appInfo=ApplicationInfoList.getRepositoryInfoById((String) props.get(CCConstants.CCM_PROP_REMOTEOBJECT_REPOSITORYID));
			String remoteId=(String) props.get(CCConstants.CCM_PROP_REMOTEOBJECT_NODEID);
			HashMap<String, Object> propsNew = NodeServiceFactory.getNodeService(appInfo.getAppId()).getProperties(StoreRef.PROTOCOL_WORKSPACE, StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(), remoteId);
			props.putAll(propsNew);
		}
		rir.setIconUrl(new MimeTypesV2(appInfo).getIcon(nodeType,props,Arrays.asList(aspects)));

		if(collectionRefOriginalDeleted){
			props.put(CCConstants.VIRT_PROP_ORIGINAL_DELETED, "true");
		}
		
		//Preview Url not longer in cache
		String renderServiceUrlPreview = URLTool.getRenderServiceURL(nodeRef.getId(), true);
		
		if (renderServiceUrlPreview != null) {
			props.put(CCConstants.CM_ASSOC_THUMBNAILS, renderServiceUrlPreview);
		} else {
			props.put(CCConstants.CM_ASSOC_THUMBNAILS, URLTool.getPreviewServletUrl(nodeRef));
		}
		
		
		//put license
		String commonLicensekey = (String)props.get(CCConstants.CCM_PROP_IO_COMMONLICENSE_KEY);
		if(commonLicensekey != null){
			String ccversion = (String)props.get(CCConstants.CCM_PROP_IO_COMMONLICENSE_CC_VERSION);
			String licenseUrl = new LicenseService().getLicenseUrl(commonLicensekey, locale,ccversion);
			if(licenseUrl != null){
				props.put(CCConstants.VIRT_PROP_LICENSE_URL, licenseUrl);	
			}
			
			String licenseIcon = new LicenseService().getIconUrl(commonLicensekey);
			if(licenseIcon != null) props.put(CCConstants.VIRT_PROP_LICENSE_ICON, licenseIcon);
		}
		
		props=VCardConverter.addVCardProperties(nodeType,props);
		rir.setProperties(convertProperties(props));
		
		List<org.edu_sharing.webservices.types.Child> childrenConverted = new ArrayList<>();
		List<Map<String, Object>> children = getChildNodes(nodeId);
		String baseUrl=getHeaderValue("baseUrl",MessageContext.getCurrentContext());
		// when baseUrl is not available from client (e.g. a request from LMS)
		if(baseUrl==null || baseUrl.isEmpty())
			baseUrl=URLTool.getBaseUrl(false);
		for(Map<String, Object> child : children) {
			org.edu_sharing.webservices.types.Child childConverted=new org.edu_sharing.webservices.types.Child();
			String childId=(String) child.get(CCConstants.SYS_PROP_NODE_UID);
			String type=nodeService.getType(childId);
			String[] childAspects=nodeService.getAspects((String) child.get(CCConstants.SYS_PROP_STORE_PROTOCOL),(String) child.get(CCConstants.SYS_PROP_STORE_IDENTIFIER),childId);
			child=VCardConverter.addVCardProperties(type,child);
			childConverted.setProperties(convertProperties(child));
			childConverted.setAspects(aspects);
			childConverted.setIconUrl(new MimeTypesV2(appInfo).getIcon(type,child,Arrays.asList(childAspects)));
			childConverted.setPreviewUrl(
					URLTool.getPreviewServletUrl(
							childId,
							StoreRef.PROTOCOL_WORKSPACE,
							StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),
							baseUrl));
			childrenConverted.add(childConverted);

		}
		rir.setChildren(childrenConverted.toArray(new org.edu_sharing.webservices.types.Child[childrenConverted.size()]));
		//rir.setLabels(labelResult.toArray(new KeyValue[labelResult.size()]));
		
		
		/**
		 * hasContentLicense: just check readPermissions for the user at the moment
		 * 
		 * maybe check mediacenter groupmembership when readContent vs readMetadata is important
		 */
		
		//set default
		//Has the user alf permissions on the node? -> check if he also has read_all permissions
		if(permissionService.hasPermission(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId, userName, CCConstants.PERMISSION_READ))
			rir.setHasContentLicense(permissionService.hasPermission(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),nodeId, userName, CCConstants.PERMISSION_READ_ALL));
		else // otherwise, we currently assume the material is embedded in a course (usage), so do allow read access
			rir.setHasContentLicense(true);
		String cost = (String)props.get(CCConstants.CCM_PROP_IO_CUSTOM_LICENSE_KEY);
		if(cost != null && (cost.contains("license_rp") || cost.contains("license_none"))) {
			
			String permissionsNodeId = nodeId;
			if (Arrays.asList(aspects).contains(CCConstants.CCM_ASPECT_COLLECTION_IO_REFERENCE)){
				permissionsNodeId = client.getProperty(MCAlfrescoAPIClient.storeRef, nodeId , CCConstants.CCM_PROP_IO_ORIGINAL);
							
			}
			if(!permissionService.hasPermission(StoreRef.PROTOCOL_WORKSPACE,StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(), permissionsNodeId, userName,CCConstants.PERMISSION_READ_ALL)) {
				rir.setHasContentLicense(false);
			}	
			
		}
		
		
		if(Arrays.asList(client.getAspects(nodeId)).contains(CCConstants.CCM_ASPECT_TOOL_OBJECT)) {
			String toolInstanceNodeRef = client.getProperty(MCAlfrescoAPIClient.storeRef, nodeId, CCConstants.CCM_PROP_TOOL_OBJECT_TOOLINSTANCEREF);
			String nodeIdToolInstance = new NodeRef(toolInstanceNodeRef).getId();

			HashMap<String,Object> propsToolInstance = client.getProperties(MCAlfrescoAPIClient.storeRef.getProtocol(),
					MCAlfrescoAPIClient.storeRef.getIdentifier(),
					nodeIdToolInstance);

			List<KeyValue> propsResultToolInstance = new ArrayList<KeyValue>();
			for(Map.Entry<String, Object> entry : propsToolInstance.entrySet()) {
				KeyValue kv = new KeyValue(entry.getKey(),(String)entry.getValue());
				propsResultToolInstance.add(kv);
			}

			rir.setPropertiesToolInstance(propsResultToolInstance.toArray(new KeyValue[propsResultToolInstance.size()]));
		}
		String clientBaseUrl = appInfo.getClientBaseUrl();
		String previewUrl = URLTool.getPreviewServletUrl(
				nodeId,
				StoreRef.PROTOCOL_WORKSPACE,
				StoreRef.STORE_REF_WORKSPACE_SPACESSTORE.getIdentifier(),
				baseUrl);
		rir.setPreviewUrl(previewUrl);
		rir.setMimeTypeUrl(new MimeTypes(clientBaseUrl).getIconUrl(props, Theme.getThemeId()));
		rir.setAspects(client.getAspects(nodeId));
		rir.setDirectory(MimeTypesV2.isDirectory(props));
		addMetadataTemplate(rir,locale,nodeType,props,appInfo);

		return rir;
	}
	private KeyValue[] convertProperties(Map<String,Object> propertiesIn) {
		List<KeyValue> propsresult = new ArrayList<KeyValue>();

		//MetadataSetV2 mds = MetadataReaderV2.getMetadataset(ApplicationInfoList.getRepositoryInfoById(appId),CCConstants.metadatasetdefault_id);
		for(Map.Entry<String,Object> entry : propertiesIn.entrySet()){
			//MetadataWidget viewProperty = (isRemoteObject) ? null :  mds.findWidget(CCConstants.getValidLocalName(entry.getKey()));
			if(entry.getKey() != null && entry.getValue() != null) {
				propsresult.add(new KeyValue(entry.getKey(),entry.getValue().toString()));
			}
		}
		return propsresult.toArray(new KeyValue[propsresult.size()]);
	}

	private List<Map<String, Object>> getChildNodes(String nodeId) throws Throwable {
		return NodeServiceHelper.getSubobjects(NodeServiceFactory.getLocalService(),nodeId);

	}
	private static HashMap<String, Object> removeUTF16Chars(Map<String, Object> props){
		HashMap<String, Object> propsClean = new HashMap(props);
		for(Map.Entry<String, Object> set : propsClean.entrySet()){
			if(set.getValue() instanceof String){
				String s= (String) set.getValue();
				/*
				// also matches "-"
				s = s.replaceAll( "([\\ud800-\\udbff\\udc00-\\udfff])", "");
				propsClean.put(set.getKey(),s);
				*/
				StringBuilder sb = new StringBuilder();
				for (int i = 0; i < s.length(); i++) {
					if (i<s.length()-1 && Character.isSurrogatePair(s.charAt(i), s.charAt(i + 1))) {
						i++;
						continue;
					}
					sb.append(s.charAt(i));
				}
				propsClean.put(set.getKey(),sb.toString());

			}
		}
		return propsClean;
	}
	private void addMetadataTemplate(RenderInfoResult rir,String locale,String type, Map<String, Object> props,ApplicationInfo appInfo) throws Exception {
		String mdsId = (String)props.get(CCConstants.CM_PROP_METADATASET_EDU_METADATASET);
		if(mdsId==null)
			mdsId = CCConstants.metadatasetdefault_id;
		MetadataSetV2 mds = MetadataReaderV2.getMetadataset(appInfo, mdsId,locale);
		
		HashMap<String, String[]> propsConverted = new HashMap<String, String[]>();
		for(String key : props.keySet()){
			String keyLocal=CCConstants.getValidLocalName(key);
			
			if(props.get(key) == null) continue;
			
			String[] values=new ValueTool().getMultivalue(props.get(key).toString());
			propsConverted.put(keyLocal, values);
		}
		rir.setMdsTemplate(new MetadataTemplateRenderer(mds,propsConverted).render("io_render"));
	}

	String getHeaderValue(String key, MessageContext msgContext) throws SOAPException, AxisFault{
		NodeList  list = msgContext.getMessage().getSOAPHeader().getElementsByTagName(key);
		
		for (int i = 0; i < list.getLength(); i++) {
			
			Node node = list.item(i);
			SOAPHeaderElement ele =  (SOAPHeaderElement)node;
			//System.out.println(node.getNodeName()+" "+ node.getNodeValue()+ " node.getLocalName(): "+node.getLocalName()+ " she:"+ele.getValue());
					
			if(key.equals(node.getLocalName())){
				return ele.getValue();
			}
			
		}
		return null;
	}
	
}
