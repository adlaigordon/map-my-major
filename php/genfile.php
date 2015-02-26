<?php
    $contents = $_POST["file"];
    $file = fopen("downloads/myschedule.json", "w");
    fwrite($file, $contents);
    fclose($file);
?>