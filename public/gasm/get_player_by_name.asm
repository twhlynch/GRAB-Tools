#DEFINE name "dotindex"    ; target player
#DEFINE length name.length ; length of target player name

LABEL start

; init variables

SET R7 0 ; incrementing player id (i)

; main logic loop

LABEL loop
  GREATER R6 R7 Player.Count ; if i > count
  IF R6 try again later

  SET Player.SelIndex R7 ; select player i

  NOT R6 Player.Valid ; check valid
  IF R6 player is not target

  GOTO is player target
  LABEL player is not target

  ADD R7 R7 1 ; i++
GOTO loop

; check if player name is target name

LABEL is player target
  SET Player.Control 0 ; reset name

  #FOR i 0 length-1 ; loop over the name
    #DEFINE ch name[i]

    EQUAL R6 Player.Name '#ch' ; if name matches
    NOT R6 R6               ; *if name doesnt match
    IF R6 player is not target

    SET Player.Control 2 ; step name to next character
  #END

  EQUAL R6 Player.Name 0 ; if we reached the end
  IF R6 player is target

  GOTO player is not target

; wait and try again later

LABEL try again later
  SLEEP 1000 ; 1 seconds
  GOTO start

LABEL player is target

; selected player is the target

; do something here with the player...

; for example, make something float above them
LABEL logic

  SET Obj.Pos.X Player.Pos.X   ; move to player
  SET Obj.Pos.Z Player.Pos.Z
  ADD Obj.Pos.Y Player.Pos.Y 1 ; above player

  SET Obj.Rot.Y Player.Rot.Y ; rotate with player

  SLEEP 0
GOTO logic
