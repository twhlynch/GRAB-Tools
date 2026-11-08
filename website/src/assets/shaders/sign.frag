varying vec2 vTexcoord;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform sampler2D colorTexture;

uniform float fogEnabled;
uniform vec2 cameraFogDistance;
uniform vec3 cameraFogColor0;
uniform vec3 cameraFogColor1;
uniform float sunSize;
uniform vec3 sunColor;
uniform float sunBrightness;
uniform vec3 ambientTint;
uniform vec3 sunDirection;
uniform vec4 specularColor;

// one row per light, 3 texels per row, point lights then spot lights
// texel 0: xyz = world position, w = range
// texel 1: xyz = color * intensity, w = falloff shape
// texel 2: xyz = forward direction, w = cos(half angle)
uniform sampler2D lightData;
uniform int pointLightCount;
uniform int spotLightCount;

uniform bool isSelected;

// cheap Blinn-Phong approximation
float specularPower(float nh, float shininess)
{
    float p2 = nh * nh;
    float p4 = p2 * p2;
    float p8 = p4 * p4;
    float p16 = p8 * p8;
    float p32 = p16 * p16;
    float p64 = p32 * p32;

    float s = clamp(shininess, 4.0, 128.0);

    if (s <= 16.0) return mix(p4, p16, (s - 4.0) * 0.083333336);
    if (s <= 64.0) return mix(p16, p64, (s - 16.0) * 0.020833334);
    return mix(p64, p64 * p64, (s - 64.0) * 0.015625);
}

float lightFalloff(float squaredDistance, float range, float shape) {
    float x = squaredDistance / max(range * range, 1e-6);
    float falloff = clamp(1.0 - x, 0.0, 1.0);
    float attenuation = (falloff * falloff) / (shape * x + 1.0);
    return attenuation;
}

void main()
{
    vec4 color = texture2D(colorTexture, vTexcoord);

    //Apply sun light
    vec3 cameraToVertex = vWorldPosition - cameraPosition;
    float distanceToCamera = length(cameraToVertex);
    cameraToVertex = normalize(cameraToVertex);

    vec3 N = normalize(vNormal);
    vec3 lightDirection = normalize(-sunDirection);
    vec3 toCamera = normalize(-cameraToVertex);
    float shininess = specularColor.a;

    float light = dot(N, lightDirection);
    float finalLight = clamp(light, 0.0, 1.0);
    float lightFactor = finalLight;
    lightFactor -= clamp(-light * 0.15, 0.0, 1.0);

    vec3 halfVector = normalize((-sunDirection - cameraToVertex));
    float lightSpecularSun = clamp(dot(N, halfVector), 0.0, 1.0);

    vec3 lightDiffuse = vec3(0.0);
    vec3 lightSpecular = vec3(0.0);

    // Point lights rows [0, pointLightCount)
    for (int i = 0; i < pointLightCount; i++)
    {
        vec4 positionRange = texelFetch(lightData, ivec2(0, i), 0);
        vec4 lcolor = texelFetch(lightData, ivec2(1, i), 0);
        vec3 toLight = positionRange.xyz - vWorldPosition;
        float d2 = dot(toLight, toLight);
        vec3 ldir = toLight * inversesqrt(max(d2, 1e-10));

        // falloff for point lights
        float attenuation = lightFalloff(d2, positionRange.w, lcolor.w);
        float nl = clamp(dot(N, ldir), 0.0, 1.0);
        lightDiffuse += lcolor.xyz * (nl * attenuation);

        float nh = clamp(dot(N, normalize(ldir + toCamera)), 0.0, 1.0);
        lightSpecular += specularColor.rgb * specularPower(nh, shininess) * nl * attenuation * lcolor.xyz;
    }

    // Spot lights rows [pointLightCount, pointLightCount + spotLightCount)
    for (int i = 0; i < spotLightCount; i++)
    {
        int row = pointLightCount + i;
        vec4 positionRange = texelFetch(lightData, ivec2(0, row), 0);
        vec4 lcolor = texelFetch(lightData, ivec2(1, row), 0);
        vec4 dirCos = texelFetch(lightData, ivec2(2, row), 0);
        vec3 toLight = positionRange.xyz - vWorldPosition;
        float d2 = dot(toLight, toLight);
        vec3 ldir = toLight * inversesqrt(max(d2, 1e-10));

        // falloff for spot lights
        float distanceShape = floor(lcolor.w * 0.01);
        float attenuation = lightFalloff(d2, positionRange.w, distanceShape * 0.1);

        // cone falloff based on the angle between the light direction and the direction to the vertex
        float cone = clamp(clamp((dot(-dirCos.xyz, ldir) - dirCos.w) / max(1.0 - dirCos.w, 1e-4), 0.0, 1.0) * ((lcolor.w - distanceShape * 100.0) * 0.1 + 1.0), 0.0, 1.0);
        cone *= cone;
        float nl = clamp(dot(N, ldir), 0.0, 1.0);
        lightDiffuse += lcolor.xyz * (nl * attenuation * cone);

        float nh = clamp(dot(N, normalize(ldir + toCamera)), 0.0, 1.0);
        lightSpecular += specularColor.rgb * specularPower(nh, shininess) * nl * attenuation * cone * lcolor.xyz;
    }

    color.rgb = lightDiffuse * color.rgb + 0.5 * ambientTint * color.rgb + sunColor * sunBrightness * (color.rgb * lightFactor + pow(lightSpecularSun, shininess) * specularColor.rgb * finalLight) + lightSpecular;

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

    if (isSelected) {
        color.rgb = mix(color.rgb, vec3(0.3, 1.0, 0.3), 0.05);
    }

    gl_FragColor = color;
    #include <colorspace_fragment>
}
