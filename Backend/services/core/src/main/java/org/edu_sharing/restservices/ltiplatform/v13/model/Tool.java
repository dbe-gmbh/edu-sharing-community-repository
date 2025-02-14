package org.edu_sharing.restservices.ltiplatform.v13.model;

import lombok.Getter;
import lombok.Setter;

public class Tool {
    String domain,description,appId,name,logo;
    boolean customContentOption = false;

    @Getter
    @Setter
    String resourceType;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public void setCustomContentOption(boolean customContentOption) {
        this.customContentOption = customContentOption;
    }

    public boolean isCustomContentOption() {
        return customContentOption;
    }
}
