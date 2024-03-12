# edu-sharing Backend
This is the backend part of edu-sharing.
It uses Alfresco 5.2.f as a base (Community 201707).

Link to download page:
https://hub.alfresco.com/t5/alfresco-content-services-hub/alfresco-community-edition-201707-ga-file-list/ba-p/290487

Environment configuration
-------------------------
Install java jdk on your system

We recommend using IntelliJ IDEA or Eclipse for project usage.

Create a build.[your-os-username].properties on the same level as build.properties and set the following values:

webserver.home=path/to/alfresco/tomcat

Deploy & Release
----------------
Use the Ant-Tasks provided in "build.xml" and run `deploy` (to build all files and automatically transfer them to your local alfresco tomcat) and `release` (to create a release zip file).

You may also use the task `reload`. This will cause a touch-event on the web.xml inside the edu-sharing webapp and will let tomcat reload the webapp while it's running.

After install, you can add the following part into the `tomcat/bin/setenv.sh`. if not the service loader is used to load the factories:

```bash

# the following configs are defined in other jars with serviceloader files:  
# xalan-2.7.2-alfresco.jar, xalan.jar, edu_sharing-xoai-1.0.1.jar, xercesImpl-2.10.0-alfresco-patched.jar
# so they MUST be defined as System Property
CATALINA_OPTS="-Djavax.xml.xpath.XPathFactory:http://java.sun.com/jaxp/xpath/dom=org.edu_sharing.xml.security.xpath.XPathFactory $CATALINA_OPTS"
CATALINA_OPTS="-Djavax.xml.transform.TransformerFactory=org.edu_sharing.xml.security.transform.TransformerFactory $CATALINA_OPTS"
CATALINA_OPTS="-Djavax.xml.parsers.SAXParserFactory=com.sun.org.apache.xerces.internal.jaxp.SAXParserFactoryImpl $CATALINA_OPTS"
CATALINA_OPTS="-Djavax.xml.validation.SchemaFactory:http://www.w3.org/2001/XMLSchema=org.edu_sharing.xml.security.validation.SchemaFactory $CATALINA_OPTS"
CATALINA_OPTS="-Dorg.xml.sax.driver=org.edu_sharing.xml.security.sax.XMLReader $CATALINA_OPTS"

# the following configs can be defined as systemproperties
CATALINA_OPTS="-Dorg.xml.sax.parser=com.sun.org.apache.xerces.internal.parsers.SAXParser $CATALINA_OPTS"
CATALINA_OPTS="-Djavax.xml.parsers.DocumentBuilderFactory=org.edu_sharing.xml.security.jaxp.DocumentBuilderFactory $CATALINA_OPTS"

```

After install add the following to alfresco-global.properties to prevent initial startup errors with activity enginge that are caused by security settings in org.edu_sharing.xml.security.validation.SchemaFactory:

```bash
system.workflow.engine.activiti.enabled = false
```

FAQ
---
On Startup, I see errors like
`SEVERE: Servlet [cmisws10] in web application [/alfresco] threw load() exception
java.lang.ClassNotFoundException: org.apache.cxf.transport.servlet.CXFNonSpringServlet`

These come from missing/unused libraries in alfresco core and can be ignored since these servlets are not used by edu-sharing.

---

`java.lang.OutOfMemoryError: Java heap space` occurs on Deploy

This may happens when the Ant heap is set to low.
In IntelliJ, go to Ant properties and increase the Heap size to 512MB.