# PDF source

These Python scripts generate the two PDFs in `docs/` from styled content
(using `reportlab`). They exist purely so the PDFs can be regenerated if the
documentation changes — the running application does not use Python or
these scripts in any way.

To regenerate after editing a script:

```bash
pip install reportlab
cd docs/_pdf_source
python3 build_software_requirements.py
python3 build_setup_operations_guide.py
```

Both scripts write their output one level up, into `docs/`.
