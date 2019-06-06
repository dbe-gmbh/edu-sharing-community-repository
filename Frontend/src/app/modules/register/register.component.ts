import {Component, Input, EventEmitter, Output, ElementRef, ViewChild, OnInit} from '@angular/core';
import {Toast} from "../../core-ui-module/toast";
import {Router, Route, Params, ActivatedRoute, UrlSerializer} from "@angular/router";
import {OAuthResult, LoginResult, AccessScope} from "../../core-module/core.module";
import {TranslateService} from "@ngx-translate/core";
import {Translation} from "../../core-ui-module/translation";
import {RestConnectorService} from "../../core-module/core.module";
import {RestConstants} from "../../core-module/core.module";
import {ConfigurationService} from "../../core-module/core.module";
import {FrameEventsService} from "../../core-module/core.module";
import {Title} from "@angular/platform-browser";
import {UIHelper} from "../../core-ui-module/ui-helper";
import {SessionStorageService} from "../../core-module/core.module";
import {UIConstants} from "../../core-module/ui/ui-constants";
import {Helper} from "../../core-module/rest/helper";
import {RestHelper} from "../../core-module/core.module";
import {PlatformLocation} from "@angular/common";
import {CordovaService} from "../../common/services/cordova.service";
import {RegisterFormComponent} from "./register-form/register-form.component";
import {RegisterDoneComponent} from "./register-done/register-done.component";
import {RegisterRequestComponent} from "./register-request/register-request.component";
import {RegisterResetPasswordComponent} from "./register-reset-password/register-reset-password.component";

@Component({
  selector: 'app-register',
  templateUrl: 'register.component.html',
  styleUrls: ['register.component.scss']
})
export class RegisterComponent{
    @ViewChild('registerForm') registerForm : RegisterFormComponent;
    @ViewChild('registerDone') registerDone : RegisterDoneComponent;
    @ViewChild('request') request : RegisterRequestComponent;
    @ViewChild('resetPassword') resetPassword : RegisterResetPasswordComponent;
    public isLoading=true;
    state = 'register';

    public cancel(){
        RestHelper.goToLogin(this.router, this.configService, null, null);
    }

    public requestDone(email: string ){
        this.request.submit();
    }
    public linkRegister() {
        this.router.navigate([UIConstants.ROUTER_PREFIX + "register"]);
    }
    public newPassword(){
        this.resetPassword.newPassword();
    }

  constructor(private connector : RestConnectorService,
              private toast:Toast,
              private platformLocation: PlatformLocation,
              private urlSerializer:UrlSerializer,
              private router:Router,
              private translate:TranslateService,
              private configService:ConfigurationService,
              private title:Title,
              private storage : SessionStorageService,
              private route : ActivatedRoute,
            ){
      this.route.params.subscribe((params)=>{
          if(params['status']){
              if (params['status'] == "done" || params['status'] == "done-reset" || params['status'] == "request" || params['status'] == "reset-password") {
                  this.state = params['status'];
              } else{
                  this.router.navigate([UIConstants.ROUTER_PREFIX,"register"]);
              }
          }
      });

    Translation.initialize(this.translate,this.configService,this.storage,this.route).subscribe(()=> {
        UIHelper.setTitle('REGISTER.TITLE', title, translate, configService);
            this.isLoading=false;
            if(!this.configService.instant("register.local",true)) {
                console.log("no register.local set, will go to login");
                RestHelper.goToLogin(this.router,this.configService,null,null);
            }
            setTimeout(()=>this.setParams());
            this.connector.isLoggedIn().subscribe((data)=>{
                if(data.statusCode=="OK"){
                    UIHelper.goToDefaultLocation(this.router,this.configService);
                }
            });
    });

    }

      onRegisterDone(){
          let email=this.registerForm.info.email;
          this.state='done';
          // will loose state when going back to register form
          //this.router.navigate([UIConstants.ROUTER_PREFIX,"register","done","-",email]);
          UIHelper.waitForComponent(this,"registerDone").subscribe(()=>this.registerDone.email=email);
          this.toast.toast("REGISTER.TOAST");
      }

    private setParams() {
        this.route.params.subscribe((params)=>{
            if(params['email'])
                this.registerDone.email=params['email'];
            if(params['key']) {
                if(this.registerDone)
                    this.registerDone.keyUrl = params['key'];
                if(this.resetPassword)
                    this.resetPassword.key = params['key'];
            }
        });
    }

    modifyData() {
        if (this.state == 'done'){
            this.state='register';
        } else {
            this.state='request';
        }
    }

    onPasswordRequested() {
        let email=this.request.email;
        this.state='done-reset';
        setTimeout(()=>this.registerDone.email=email);
    }
}
