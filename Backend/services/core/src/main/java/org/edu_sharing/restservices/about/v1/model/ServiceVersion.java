package org.edu_sharing.restservices.about.v1.model;


import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema;;

import com.fasterxml.jackson.annotation.JsonProperty;


@Schema(description = "")
public class ServiceVersion  {
  
  private String repository;
  private String renderservice;
  
  private int major = 0;
  private int minor = 0;

  
  /**
   **/
  @Schema(required = true, description = "")
  @JsonProperty("major")
  public int getMajor() {
    return major;
  }
  public void setMajor(int major) {
    this.major = major;
  }

  
  /**
   **/
  @Schema(required = true, description = "")
  @JsonProperty("minor")
  public int getMinor() {
    return minor;
  }
  public void setMinor(int minor) {
    this.minor = minor;
  }

  	@JsonProperty
  	public String getRepository() {
	  return repository;
	}
	public void setRepository(String repository) {
		this.repository = repository;
	}
  	@JsonProperty
  	public String getRenderservice() {
		return renderservice;
	}
	public void setRenderservice(String renderservice) {
		this.renderservice = renderservice;
	}
@Override
  public String toString()  {
    StringBuilder sb = new StringBuilder();
    sb.append("class ServiceVersion {\n");
    
    sb.append("  major: ").append(major).append("\n");
    sb.append("  minor: ").append(minor).append("\n");
    sb.append("}\n");
    return sb.toString();
  }
}
