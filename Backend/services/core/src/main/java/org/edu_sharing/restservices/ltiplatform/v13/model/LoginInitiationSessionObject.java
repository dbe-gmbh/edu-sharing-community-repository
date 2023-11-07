package org.edu_sharing.restservices.ltiplatform.v13.model;

import java.io.Serializable;

public class LoginInitiationSessionObject implements Serializable {

    public void setVersion(String version) {
        this.version = version;
    }

    public void setLaunchPresentation(String launchPresentation) {
        this.launchPresentation = launchPresentation;
    }

    public String getLaunchPresentation() {
        return launchPresentation;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getUser() {
        return user;
    }

    public Long getLastAccessed() {
        return lastAccessed;
    }

    public void setLastAccessed(long lastAccessed) {
        this.lastAccessed = lastAccessed;
    }

    public static enum MessageType{resourcelink,deeplink}

    String contextId,clientId,appId,resourceLinkNodeId,contentUrlNodeId,version,token,toolNonce,launchPresentation,user;
    boolean resourceLinkEditMode = true;

    MessageType messageType;

    Long lastAccessed;

    public String getContextId() {
        return contextId;
    }

    public void setContextId(String contextId) {
        this.contextId = contextId;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }


    public MessageType getMessageType() {
        return messageType;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

    public void setResourceLinkNodeId(String resourceLinkNodeId) {
        this.resourceLinkNodeId = resourceLinkNodeId;
    }

    public String getResourceLinkNodeId() {
        return resourceLinkNodeId;
    }

    public void setContentUrlNodeId(String contentUrlNodeId) {
        this.contentUrlNodeId = contentUrlNodeId;
    }

    public String getContentUrlNodeId() {
        return contentUrlNodeId;
    }

    public void setResourceLinkEditMode(boolean resourceLinkEditMode) {
        this.resourceLinkEditMode = resourceLinkEditMode;
    }

    public boolean isResourceLinkEditMode() {
        return resourceLinkEditMode;
    }

    public String getVersion() {
        return version;
    }

    /**
     *
     * @return encrypted token
     */
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public void setToolNonce(String toolNonce) {
        this.toolNonce = toolNonce;
    }

    public String getToolNonce() {
        return toolNonce;
    }
}
