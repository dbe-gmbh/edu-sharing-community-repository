package org.edu_sharing.repository.client.rpc;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ACE implements java.io.Serializable {

    String authority = null;
	String permission = null;
	String accessStatus = null;
    String authorityType = null;
    User user = null;
    Group group = null;
	
	int id;
	
	boolean inherited = false;
	
	boolean edited = false;
	
	public ACE() {
	}

	public ACE(String permission, String authority) {
		this.permission = permission;
		this.authority = authority;
	}

	@Override
	public int hashCode() {
		final int prime = 3;
	      int result = 1;
	      result = prime * result + ((accessStatus == null) ? 0 : accessStatus.hashCode());
	      result = prime * result + ((authority == null) ? 0 : authority.hashCode());
	      result = prime * result + ((permission == null) ? 0 : permission.hashCode());
	      result = prime * result + new Boolean(inherited).toString().hashCode();
	      return result;
	}
	
	@Override
	public boolean equals(Object obj) {
		
		if( !(obj instanceof ACE) ) return false;
		
		ACE ace = (ACE)obj;
		
		if(ace.getAuthority().equals(this.getAuthority()) &&
				ace.getPermission().equals(this.getPermission()) &&
				ace.inherited == this.inherited){
			
			return true;
		
		}
		
		return false;
	}
}
