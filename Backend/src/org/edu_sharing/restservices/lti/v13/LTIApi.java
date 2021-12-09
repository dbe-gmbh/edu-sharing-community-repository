package org.edu_sharing.restservices.lti.v13;

import com.nimbusds.jose.jwk.AsymmetricJWK;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.edu_sharing.repository.client.tools.CCConstants;
import org.edu_sharing.repository.server.tools.ApplicationInfo;
import org.edu_sharing.repository.server.tools.ApplicationInfoList;
import org.edu_sharing.restservices.RestConstants;
import org.edu_sharing.restservices.node.v1.model.WorkflowHistory;
import org.edu_sharing.restservices.shared.ErrorResponse;
import org.edu_sharing.service.admin.AdminServiceFactory;
import org.edu_sharing.service.authority.AuthorityServiceHelper;
import org.edu_sharing.service.lti13.LTIConstants;
import org.edu_sharing.service.lti13.LTIException;
import org.edu_sharing.service.lti13.LTIOidcUtil;
import org.edu_sharing.service.lti13.LTIService;
import org.edu_sharing.service.lti13.model.LoginInitiationDTO;
import org.restlet.resource.Post;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.net.URL;
import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.Map;

@Path("/lti/v13")
@Consumes({ "text/html" })
@Produces({"text/html"})
@Tag(name="LTI v13")
public class LTIApi {

    Logger logger = Logger.getLogger(LTIApi.class);

    @POST
    @Path("/oidc/login_initiations")
    @Operation(summary = "lti authentication process preparation.", description = "preflight phase. prepares lti authentication process. checks it issuer is valid")
    @Consumes({"application/x-www-form-urlencoded"})
    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description= RestConstants.HTTP_200, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class)))
            })
    public Response loginInitiations(@Parameter(description = "Issuer of the request, will be validated",required=true) @FormParam(LTIConstants.LTI_PARAM_ISS) String iss,
                                 @Parameter(description = "target url of platform at the end of the flow",required=true) @FormParam(LTIConstants.LTI_PARAM_TARGET_LINK_URI) String targetLinkUrl,
                                 @Parameter(description = "Id of the issuer",required=false) @FormParam(LTIConstants.LTI_PARAM_CLIENT_ID) String clientId,
                                 @Parameter(description = "context information of the platform",required=false) @FormParam(LTIConstants.LTI_PARAM_LOGIN_HINT) String loginHint,
                                 @Parameter(description = "additional context information of the platform",required=false) @FormParam(LTIConstants.LTI_PARAM_MESSAGE_HINT) String ltiMessageHint,
                                 @Parameter(description = "A can have multiple deployments in a platform",required=false) @FormParam(LTIConstants.LTI_PARAM_DEPLOYMENT_ID) String ltiDeploymentId,
                                 @Context HttpServletRequest req
                                 ){
        /**
         * @TODO check if multiple deployments got an own key pair
         */

        LoginInitiationDTO dto = new LoginInitiationDTO(iss,loginHint,targetLinkUrl,ltiMessageHint,clientId,ltiDeploymentId);
        LTIService ltiService = new LTIService();
        try {
            /**
             * @TODO maybe use db instead of applicationinfo
             */
            ApplicationInfo applicationInfo = ltiService.getApplicationInfo(iss, clientId, ltiDeploymentId);
            Map<String, String> model = new LTIOidcUtil().generateAuthRequestPayload(applicationInfo, dto);
            return Response.status(Response.Status.OK).entity(getHTML(applicationInfo.getLtiOidc(),model,null)).build();
        } catch (LTIException | GeneralSecurityException | IOException e) {
            return Response.status(Response.Status.OK).entity(getHTML(null,null,e.getMessage())).build();
        }
    }

    /**
     * @TODO use template engine?
     * @param formTargetUrl
     * @param params
     * @return
     */
    private String getHTML(String formTargetUrl, Map<String,String> params, String errorMessage){
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body>");
        if(errorMessage == null) {
            sb.append("<form action=\"" + formTargetUrl + "\" method=\"post\"");
            for (Map.Entry<String, String> entry : params.entrySet()) {
                sb.append("<input type=\"hidden\" id=\"" + entry.getKey() + "\" name=\"" + entry.getKey() + "\" value=\"" + entry.getValue() + "\" class=\"form-control\"/>");
            }
            sb.append("<input type=\"submit\" value=\"Submit POST\" class=\"btn btn-primary\">")
                    .append("</form>");
        }else {
            sb.append("error:"+ errorMessage);
        }
        sb.append("</body></html>");
        return sb.toString();
    }


    @POST
    @Path("/" + LTIConstants.LTI_TOOL_REDIRECTURL_PATH)
    @Operation(summary = "lti tool redirect.", description = "lti tool redirect")

    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class)))
            })
    public Response lti(@Parameter(description = "Issuer of the request, will be validated",required=true) @QueryParam("id_token") String idToken,
                        @Parameter(description = "Issuer of the request, will be validated",required=true) @QueryParam("state") String state,
                        @Context HttpServletRequest req){
        logger.info("id_token:"+idToken +" state:"+state);
        return Response.status(Response.Status.OK).build();
    }


    @POST
    @Path("/test")
    @Operation(summary = "lti tool test.", description = "lti tool test")

    @ApiResponses(
            value = {
                    @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class))),
                    @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(mediaType = "text/html", schema = @Schema(implementation = String.class)))
            })
    public Response ltiTest(@Parameter(description = "Issuer of the request, will be validated",required=true) @QueryParam("id_token") String idToken,
                        @Parameter(description = "Issuer of the request, will be validated",required=true) @QueryParam("state") String state,
                        @Context HttpServletRequest req){
        logger.info("id_token:"+idToken +" state:"+state);
        return Response.status(Response.Status.OK).build();
    }

    @POST
    @Path("/registration")
    @Operation(summary = "register LTI platform")
    @Consumes({ "application/json" })
    @Produces({ "application/json"})
    @ApiResponses(value = {
            @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = Void.class))),
            @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = ErrorResponse.class))) })
    public Response registerTest(@Parameter(description = "the issuer",required=true) @QueryParam("platformId") String platformId,
                                 @Parameter(description = "client id",required=true) @QueryParam("client_id") String clientId,
                                 @Parameter(description = "deployment id",required=true)  @QueryParam("deployment_id") String deploymentId,
                                 @Parameter(description = "oidc endpoint, authentication request url",required=true) @QueryParam("authentication_request_url") String authenticationRequestUrl,
                                 @Parameter(description = "jwks endpoint, keyset url",required=true) @QueryParam("keyset_url") String keysetUrl,
                                 @Parameter(description = "jwks key id",required=false) @QueryParam("key_id") String keyId,
                                 @Parameter(description = "auth token url",required=true) @QueryParam("auth_token_url") String authTokenUrl,
                                 @Context HttpServletRequest req
    ){
        try {
            registerPlatform(platformId,clientId,deploymentId,authenticationRequestUrl,keysetUrl,keyId,authTokenUrl);
            return Response.ok().build();
        } catch (Throwable t) {
            return ErrorResponse.createResponse(t);
        }
    }

    public static enum LTI_Plattforms {moodle};

    @POST
    @Path("/registration/{type}")
    @Operation(summary = "register LTI platform")
    @Consumes({ "application/json" })
    @Produces({ "application/json"})
    @ApiResponses(value = {
            @ApiResponse(responseCode="200", description=RestConstants.HTTP_200, content = @Content(schema = @Schema(implementation = Void.class))),
            @ApiResponse(responseCode="400", description=RestConstants.HTTP_400, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="401", description=RestConstants.HTTP_401, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="403", description=RestConstants.HTTP_403, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="404", description=RestConstants.HTTP_404, content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode="500", description=RestConstants.HTTP_500, content = @Content(schema = @Schema(implementation = ErrorResponse.class))) })
    public Response registerByType(@Parameter(description = "lti platform typ i.e. moodle", required=true) @PathParam("type") LTI_Plattforms type,
                                   @Parameter(description = "base url i.e. http://localhost/moodle used as platformId",required=true) @QueryParam("baseUrl") String baseUrl,
                                   @Parameter(description = "client id",required=false) @QueryParam("client_id") String clientId,
                                   @Parameter(description = "deployment id",required=false) @QueryParam("deployment_id") String deploymentId,
                                   @Context HttpServletRequest req
    ){
        try {

            registerPlatform(baseUrl,clientId,deploymentId,
                    baseUrl + LTIConstants.MOODLE_AUTHENTICATION_REQUEST_URL_PATH,
                    baseUrl + LTIConstants.MOODLE_KEYSET_URL_PATH,
                    null,
                    baseUrl+LTIConstants.MOODLE_AUTH_TOKEN_URL_PATH);
            return Response.ok().build();
        } catch (Throwable t) {
            return ErrorResponse.createResponse(t);
        }
    }


    private void registerPlatform(String platformId,
                                  String clientId, String deploymentId,
                                  String authenticationRequestUrl,
                                  String keysetUrl,
                                  String keyId,
                                  String authTokenUrl) throws Exception{
        if(!AuthorityServiceHelper.isAdmin()){
            throw new Exception("must be an admin to register lti platforms");
        }
        HashMap<String,String> properties = new HashMap<>();
        properties.put(ApplicationInfo.KEY_APPID, new LTIService().getAppId(platformId,clientId,deploymentId));
        properties.put(ApplicationInfo.KEY_TYPE, "lti");
        properties.put(ApplicationInfo.KEY_LTI_DEPLOYMENT_ID, deploymentId);
        properties.put(ApplicationInfo.KEY_LTI_ISS, platformId);
        properties.put(ApplicationInfo.KEY_LTI_CLIENT_ID, clientId);
        properties.put(ApplicationInfo.KEY_LTI_OIDC_ENDPOINT, authenticationRequestUrl);
        properties.put(ApplicationInfo.KEY_LTI_AUTH_TOKEN_ENDPOINT,authTokenUrl);

        JWKSet publicKeys = JWKSet.load(new URL(keysetUrl));
        if(publicKeys == null){
            throw new Exception("no public key found");
        }
        JWK jwk = (keyId == null) ? publicKeys.getKeys().get(0) :publicKeys.getKeyByKeyId(keyId);

        String pubKeyString = "-----BEGIN PUBLIC KEY-----\n"
                + new String(new Base64().encode(((AsymmetricJWK) jwk).toPublicKey().getEncoded())) + "-----END PUBLIC KEY-----";
        properties.put(ApplicationInfo.KEY_PUBLIC_KEY, pubKeyString);
        AdminServiceFactory.getInstance().addApplication(properties);
    }


}
