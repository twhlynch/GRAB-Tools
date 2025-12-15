;
;  gun.asm
;
;  fires a projectile 'Laz' from a gun 'Gun' in its local -z direction
;

; teleport the lazer to inside gun and match its rotation

SET Laz.Pos.X Gun.Pos.X ; set lazer position
SET Laz.Pos.Y Gun.Pos.Y
SET Laz.Pos.Z Gun.Pos.Z

SET Laz.Rot.X Gun.Rot.X ; set lazer rotation
SET Laz.Rot.Y Gun.Rot.Y
SET Laz.Rot.Z Gun.Rot.Z

; GRAB rotation order is YXZ ( pitch yaw roll )
; calculate forward direction ( local -z )

; x = -sx * cy
; y = sy
; z = -cx * cy

COS R4 Laz.Rot.X ;  cx
COS R5 Laz.Rot.Y ;  cy
SIN R6 Laz.Rot.X ;  sx
SIN R7 Laz.Rot.Y ;  sy

MUL R6 R6 -1     ; -sx
MUL R4 R4 -1     ; -cx

MUL R0 R6 R5     ; x = -sx * cy
SET R1 R7        ; y = sy
MUL R2 R4 R5     ; z = -cx * cy

; normalise vector so its length is 1
; this ensures diagonal directions arent longer and therefore faster
; run the following on each of x y z
; _ = _ / sqrt(x^2 + y^2 + z^2)

MUL R3 R0 R0 ; x^2
MUL R4 R1 R1 ; y^2
MUL R5 R2 R2 ; z^2

ADD R3 R3 R4 ; x^2 + y^2
ADD R3 R3 R5 ; x^2 + y^2 + z^2

SQRT R3 R3   ; length

DIV R0 R0 R3 ; x / length
DIV R1 R1 R3 ; y / length
DIV R2 R2 R3 ; z / length

; apply speed

SET R3 100   ; speed constant

MUL R0 R0 R3 ; multiply x y z by speed
MUL R1 R1 R3
MUL R2 R2 R3

; infinitely move in direction

LABEL LOOP

    ; multiply movement by delta

    SET R6 DeltaTime

    MUL R3 R0 R6 ; multiplying any movement by DeltaTime means it will
    MUL R4 R1 R6 ; be consistent with long or short frames (from lag)
    MUL R5 R2 R6

    ; gravity

    MUL R7 R6 -9.81 ; 9.81 m/s down * DeltaTime
    ADD R4 R4 R7    ; add to y movement

    ; add to lazer position to move it

    ADD Laz.Pos.X R3 Laz.Pos.X ; add the movement to the lazers position
    ADD Laz.Pos.Y R4 Laz.Pos.Y
    ADD Laz.Pos.Z R5 Laz.Pos.Z

    ; only run once per frame

    SLEEP 0 ; sleeping for 0 will just prevent any more instructions running this frame

GOTO LOOP
