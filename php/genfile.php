<?php
    $contents = $_POST["file"];
    $rand = $_POST["rand"];
    $file = fopen("downloads/$rand.json", "w");
    fwrite($file, $contents);
    fclose($file);
?>