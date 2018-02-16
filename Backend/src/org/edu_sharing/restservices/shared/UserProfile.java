package org.edu_sharing.restservices.shared;

import java.util.List;

import org.edu_sharing.repository.client.rpc.User;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;


@ApiModel(description = "")
public class UserProfile  {
  
  private String firstName = null;
  private String lastName = null;
  private String email = null;
  private String avatar = null;
  private String about = null;
  private String[] skills = null;
  private String type = null;

  public UserProfile(){
	  
  }
  public UserProfile(String firstName,String lastName,String email){
	  this.firstName=firstName;
	  this.lastName=lastName;
	  this.email=email;
  }
  public UserProfile(User user) {
	this(user.getGivenName(),user.getSurname(),user.getEmail());
  }

/**
   **/
  @ApiModelProperty(value = "")
  @JsonProperty("firstName")
  public String getFirstName() {
    return firstName;
  }
  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  
  /**
   **/
  @ApiModelProperty(value = "")
  @JsonProperty("lastName")
  public String getLastName() {
    return lastName;
  }
  public void setLastName(String lastName) {
    this.lastName = lastName;
  }

  
  /**
   **/
  @ApiModelProperty(value = "")
  @JsonProperty("email")
  public String getEmail() {
    return email;
  }
  public void setEmail(String email) {
    this.email = email;
  }
  
	@JsonProperty("avatar")
	public String getAvatar() {
		return avatar;
	}
	public void setAvatar(String avatar) {
		this.avatar = avatar;
	}
	@JsonProperty("about")
	public String getAbout() {
		return about;
	}
	public void setAbout(String about) {
		this.about = about;
	}
	@JsonProperty
	public String[] getSkills() {
		return skills;
	}
	public void setSkills(String[] skills) {
		this.skills = skills;
	}
	@JsonProperty
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
}
