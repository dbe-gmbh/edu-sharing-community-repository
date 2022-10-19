package org.edu_sharing.service.bulk;

import org.apache.log4j.Logger;
import org.edu_sharing.metadataset.v2.MetadataKey;
import org.edu_sharing.metadataset.v2.MetadataSetV2;
import org.edu_sharing.metadataset.v2.MetadataWidget;
import org.edu_sharing.metadataset.v2.tools.MetadataHelper;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;

import java.util.*;
import java.util.stream.Collectors;

/**
 * convert incoming skos values into local valuespaces (if available)
 * automatically filters unsupported entries/keys in valuespaces
 * repository.bulk.interceptors += "org.edu_sharing.server.bulk.BulkServiceInterceptorSKOSToLocal"
 * */
public class BulkServiceInterceptorSKOSToLocal implements BulkServiceInterceptorInterface{
    static Logger logger = Logger.getLogger(BulkServiceInterceptorSKOSToLocal.class);
    /**
     * Preprocess properties before they get stored and post-processed by the bulk service
     */
    public HashMap<String, Object> preprocessProperties(HashMap<String, Object> properties) {
        String mdsId = (String) properties.getOrDefault(CCConstants.CM_PROP_METADATASET_EDU_METADATASET, CCConstants.metadatasetdefault_id);
        try {
            MetadataSetV2 mds = MetadataHelper.getMetadataset(ApplicationInfoList.getHomeRepository(), mdsId);
            mds.getWidgets().stream().filter(
                    w -> w.getTemplate() == null && w.getCondition() == null && w.getValues() != null && !w.getValues().isEmpty()
            ).forEach(w -> {
                Object values = properties.get(CCConstants.getValidGlobalName(w.getId()));
                if(values != null) {
                    if(values instanceof String) {
                        values = Collections.singletonList(values);
                    }
                    List<?> valuesList = ((List<?>) values);
                    if(valuesList.stream().allMatch(v -> v.toString().toLowerCase().startsWith("http"))) {
                        List<String> result = mapValues(w, valuesList);
                        logger.info("transformed SKOS properties of " + w.getId() + "("  + result.size() +" mapped from total of " + valuesList.size() + ")");
                        if(result.isEmpty()) {
                            properties.remove(CCConstants.getValidGlobalName(w.getId()));
                        } else {
                            properties.put(CCConstants.getValidGlobalName(w.getId()), result);
                        }
                    }
                }

            });
        } catch (Exception e) {
            logger.warn("Could not transform SKOS properties: " + e.getMessage(), e);
        }
        return properties;
    }

    protected List<String> mapValues(MetadataWidget widget, List<?> valuesList) {
        Map<String, MetadataKey> map = widget.getValuesAsMap();
        return valuesList.stream().map(v -> (String) v).map(v -> {
                    if(map.containsKey(v)) {
                        return v;
                    }
                    String[] splitted = v.split("/");
                    return splitted[splitted.length - 1];
                }).filter(map::containsKey)
                .map(map::get)
                .map(MetadataKey::getKey)
                .collect(Collectors.toList());
    }
}
