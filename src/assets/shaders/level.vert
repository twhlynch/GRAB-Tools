varying vec3 vWorldPosition;
varying vec3 vInitialWorldPosition;
varying vec3 vNormal;
varying vec3 vLocalPosition;
varying vec3 vFrozenNormal;

uniform mat4 worldMatrix;
uniform mat3 frozenNormalMatrix;
uniform mat3 worldNormalMatrix;

#include <common>
#include <shadowmap_pars_vertex>

void main()
{
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 initialWorldPosition = worldMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vInitialWorldPosition = initialWorldPosition.xyz;
    vLocalPosition = position;

    vNormal = worldNormalMatrix * normal;
    vFrozenNormal = frozenNormalMatrix * normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <shadowmap_vertex>
}
