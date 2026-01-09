varying vec2 vTexcoord;
varying vec3 vWorldPosition;

uniform vec4 diffuseColor;

uniform float fogEnabled;
uniform vec2 cameraFogDistance;
uniform vec3 cameraFogColor0;
uniform vec3 cameraFogColor1;
uniform float sunSize;
uniform vec3 sunColor;
uniform vec3 sunDirection;

uniform bool isSelected;

void main()
{
    vec4 color = diffuseColor;
    color.a = 1.0;

    //Fog
    if (fogEnabled > 0.5)
    {
        vec3 cameraToVertex = vWorldPosition - cameraPosition;
        float distanceToCamera = length(cameraToVertex);
        cameraToVertex = normalize(cameraToVertex);

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

    if (isSelected) {
        color.rgb = mix(color.rgb, vec3(0.3, 1.0, 0.3), 0.05);
    }

    gl_FragColor = color;
}
