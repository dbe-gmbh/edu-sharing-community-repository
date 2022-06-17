package org.edu_sharing.alfresco.transformer;

import org.alfresco.transformer.AbstractTransformerController;
import org.alfresco.transformer.probes.ProbeTestTransform;
import org.edu_sharing.alfresco.transformer.executors.VideoThumbnailExecutor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;

import java.io.File;
import java.util.Collections;
import java.util.Map;

@Controller
public class EduSharingController extends AbstractTransformerController {
    private static final Logger logger = LoggerFactory.getLogger(EduSharingController.class);
    @Autowired
    VideoThumbnailExecutor videoThumbnailExecutor;


    @Override
    public void transformImpl(String transformName, String sourceMimetype, String targetMimetype, Map<String, String> transformOptions, File sourceFile, File targetFile) {
        if(transformName.equals(VideoThumbnailExecutor.ID)){
            try {
                this.videoThumbnailExecutor.transform(transformName,sourceMimetype,targetMimetype,transformOptions,sourceFile,targetFile);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }else{
            logger.error("unsupported transformer:" + transformName);
        }
    }

    @Override
    public String getTransformerName() {
        return "edu-sharing transformations";
    }

    @Override
    protected String getTransformerName(File sourceFile, String sourceMimetype, String targetMimetype, Map<String, String> transformOptions) {
        return VideoThumbnailExecutor.ID;
    }

    @Override
    public ProbeTestTransform getProbeTestTransform() {
        return new ProbeTestTransform(this,"source.txt","target.txt",180, 20, 150, 1024,
                1,1) {
            @Override
            protected void executeTransformCommand(File sourceFile, File targetFile) {
                Map<String, String> transformOptions = Collections.singletonMap("language", "Spanish");
                transformImpl("helloWorld", "text/plain", "text/html", transformOptions, sourceFile, targetFile);
            }
        };
    }

    @Override
    public String version() {
        return getTransformerName() + " available";
    }
}
