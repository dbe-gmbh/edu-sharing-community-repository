package org.edu_sharing.service.nodeservice;

import org.apache.commons.collections.map.LRUMap;
import org.apache.log4j.Logger;
import org.apache.solr.common.util.Hash;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.server.SearchResultNodeRef;
import org.edu_sharing.repository.server.tools.ApplicationInfo;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;
import org.edu_sharing.service.search.SearchServiceBrockhausImpl;
import org.edu_sharing.service.search.SearchServicePixabayImpl;

import javax.net.ssl.HttpsURLConnection;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;

public class NodeServiceBrockhausImpl extends NodeServiceAdapterCached{

	private String repositoryId;
	private Logger logger= Logger.getLogger(NodeServiceBrockhausImpl.class);
	private String apiKey;

	public NodeServiceBrockhausImpl(String appId) {
		super(appId);
		ApplicationInfo appInfo = ApplicationInfoList.getRepositoryInfoById(appId);
		this.repositoryId = appInfo.getAppId();		
		this.apiKey = appInfo.getApiKey();
	}

	@Override
	public HashMap<String, Object> getProperties(String storeProtocol, String storeId, String nodeId) throws Throwable {
		HashMap<String, Object> props = super.getProperties(storeProtocol, storeId, nodeId);
		if (props == null) {
			props = new HashMap<>();
		}
		String url=SearchServiceBrockhausImpl.buildUrl(apiKey,nodeId);
		props.put(CCConstants.CONTENTURL,url);
		props.put(CCConstants.CCM_PROP_IO_WWWURL,url);

		return props;
	}
	@Override
	public HashMap<String, Object> getPropertiesDynamic(String storeProtocol, String storeId, String nodeId) throws Throwable {
		return getProperties(storeProtocol, storeId, nodeId);
	}

	@Override
	public InputStream getContent(String nodeId) throws Throwable{
		return null;
	}
}
