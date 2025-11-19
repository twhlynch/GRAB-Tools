varying vec3 vWorldPosition;
varying vec3 vInitialWorldPosition;
varying vec3 vNormal;

uniform sampler2D colorTexture;
uniform float tileFactor;
uniform vec3 diffuseColor;
uniform float neonEnabled;
uniform float transparentEnabled;
uniform float fogEnabled;
uniform float isLava;
uniform float isColoredLava;

uniform vec2 cameraFogDistance;
uniform vec3 cameraFogColor0;
uniform vec3 cameraFogColor1;
uniform float sunSize;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform vec4 specularColor;

uniform bool isSelected;

void main()
{
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 texColor = vec4(0.0, 0.0, 0.0, 1.0);

    vec3 blendNormals = abs(vNormal);
    if (blendNormals.x > blendNormals.y && blendNormals.x > blendNormals.z)
    {
        texColor.rgb = texture2D(colorTexture, vInitialWorldPosition.zy * tileFactor).rgb;
    }
    else if (blendNormals.y > blendNormals.z)
    {
        texColor.rgb = texture2D(colorTexture, vInitialWorldPosition.xz * tileFactor).rgb;
    }
    else
    {
        texColor.rgb = texture2D(colorTexture, vInitialWorldPosition.xy * tileFactor).rgb;
    }

    color.rgb = texColor.rgb * diffuseColor;

    if (isColoredLava > 0.5) {
        vec3 blendValues = vec3(texColor.b);
        color.rgb = mix(diffuseColor.rgb, specularColor.rgb, blendValues.b);
        color.rgb += blendValues.g * 0.1 - (1.0 - blendValues.r) * 0.2;
    } else if (isLava > 0.5) {
        color.rgb = vec3(color.rg, 0);
    }

    vec3 cameraToVertex = vWorldPosition - cameraPosition;
    float distanceToCamera = length(cameraToVertex);
    cameraToVertex = normalize(cameraToVertex);

    if (neonEnabled < 0.5)
    {
        //Apply sun light
        vec3 lightDirection = normalize(-sunDirection);

        float light = dot(normalize(vNormal), lightDirection);
        float finalLight = clamp(light, 0.0, 1.0);
        float lightFactor = finalLight;
        lightFactor -= clamp(-light * 0.15, 0.0, 1.0);

        vec3 halfVector = normalize((-sunDirection - cameraToVertex));
        float lightSpecular = clamp(dot(normalize(vNormal), halfVector), 0.0, 1.0);

        color.rgb = 0.5 * color.rgb + sunColor * clamp(sunSize * 0.7 + 0.3, 0.0, 1.0) * (color.rgb * lightFactor + pow(lightSpecular, specularColor.a) * specularColor.rgb * finalLight);
    }

    //Fog
    if (fogEnabled > 0.5)
    {
        float horizonFactor = 1.0 - clamp(abs(cameraToVertex.y) / 0.8, 0.0, 1.0);
        vec3 fogColor = mix(cameraFogColor1.rgb, cameraFogColor0.rgb, horizonFactor * horizonFactor);

        float sunAngle = acos(dot(sunDirection, -cameraToVertex));
        float sunSize_ = 0.05 * sunSize;
        float sunGlowSize = sunSize;
        float sunFactor = clamp((sunGlowSize - sunAngle) / sunGlowSize, 0.0, 1.0);
        sunFactor *= sunFactor;
        fogColor = mix(fogColor, sunColor, sunFactor);

        float fogAmount = clamp((1.0 - exp(-distanceToCamera * cameraFogDistance.x)) * cameraFogDistance.y, 0.0, 1.0);
        color.rgb = mix(color.rgb, fogColor, fogAmount * fogAmount);
    }

    if (transparentEnabled > 0.5) {
        color.a = 0.5;
    }

    if (isSelected) {
        color.rgb = mix(color.rgb, vec3(0.3, 1.0, 0.3), 0.05);
    }

    gl_FragColor = color;

    #include <colorspace_fragment>
}
